import { afterEach, describe, expect, it, vi } from 'vitest';
import { axis, bindingValue, Controller, defaultProfile, readController } from '../../src/input/Controller';
import { FixedClock } from '../../src/core/Clock';
import { DIFFICULTIES, difficulty } from '../../src/game/Difficulty';
import { Simulation } from '../../src/game/Simulation';
import { waveSchedule } from '../../src/game/combat/Progression';
import { InputManager } from '../../src/input/InputManager';

afterEach(() => vi.unstubAllGlobals());
describe('mandos USB sin mapeo estándar', () => {
  it('conserva toques breves de disparo, bomba y portal hasta el paso de simulación', () => {
    vi.stubGlobal('window', { addEventListener: () => {}, removeEventListener: () => {} });
    const pad = { id: 'USB tap', connected: true, mapping: '', axes: [0, 0], buttons: Array.from({ length: 12 }, () => ({ pressed: false })) };
    vi.stubGlobal('navigator', { getGamepads: () => [pad] });
    const input = new InputManager(); input.poll();
    for (const [action, index] of [['fire', 0], ['bomb', 2], ['portal', 3]] as const) {
      pad.buttons[index]!.pressed = true; input.poll();
      pad.buttons[index]!.pressed = false; input.poll();
      expect(input.flight()[action]).toBe(true);
      expect(input.flight()[action]).toBe(false);
    }
    input.dispose();
  });
  it('acepta un dispositivo realista en índice no cero y lee stick y hat', () => {
    const pad = { id: 'USB Joystick (Vendor: 0079 Product: 0006)', index: 2, connected: true, mapping: '', axes: [0, 0, 3.2857], buttons: Array.from({ length: 12 }, () => ({ pressed: false, value: 0 })) };
    vi.stubGlobal('navigator', { getGamepads: () => [null, null, pad] });
    const c = new Controller(); c.poll(); expect(c.active?.id).toBe(pad.id);
    pad.axes[0] = 1; expect(c.poll().x).toBe(1);
    pad.axes[0] = 0; pad.axes[2] = -1; expect(c.poll().y).toBe(1);
    pad.axes[2] = 3.2857; expect(c.poll().y).toBe(0);
  });
  it('distingue diagonales del hat y no interpreta neutro como dirección', () => {
    const pad = { axes: [-0.7142857], buttons: [] };
    expect(bindingValue(pad, { kind: 'hat', index: 0, sector: 0 })).toBe(1);
    expect(bindingValue(pad, { kind: 'hat', index: 0, sector: 2 })).toBe(1);
    expect(bindingValue(pad, { kind: 'hat', index: 0, sector: 4 })).toBe(0);
    pad.axes[0] = 3.2857; expect(bindingValue(pad, { kind: 'hat', index: 0, sector: 0 })).toBe(0);
  });
  it('usa botones asignados sin imponer posiciones estándar', () => {
    const profile = defaultProfile(); profile.fire = { kind: 'button', index: 3 };
    const pad = { axes: [0, 0], buttons: Array.from({ length: 12 }, (_, i) => ({ pressed: i === 3 })) };
    expect(readController(pad, profile, false).fire).toBe(true);
    expect(readController(pad, defaultProfile(), false).fire).toBe(false);
  });
  it('una restricción del navegador deja controles neutros y un error legible', () => {
    vi.stubGlobal('navigator', { getGamepads: () => { throw new Error('Permissions policy'); } });
    const c = new Controller(); expect(c.poll().fire).toBe(false); expect(c.error).toContain('bloquea'); expect(c.active).toBeNull();
  });
  it('rechaza valores de ejes inválidos y perfiles corruptos', () => {
    expect(axis(NaN)).toBe(0); expect(axis(3.28)).toBe(0); expect(axis(0.1)).toBe(0);
    vi.stubGlobal('localStorage', { getItem: () => '{"pad":{"left":null}}' });
    expect(new Controller().profile).toEqual(defaultProfile());
  });
});
describe('ritmo de dificultad con paso fijo', () => {
  for (const [name, level] of Object.entries(DIFFICULTIES)) it(`${name}: escala el ritmo conservando pasos de 1/60`, () => {
    const c = new FixedClock(); let frames = 0;
    for (let i = 0; i < 600; i++) c.advance(1 / 60, dt => { expect(dt).toBe(1 / 60); frames++; }, level.speed);
    expect(frames).toBe(Math.round(600 * level.speed));
  });
  it('preferencias desconocidas vuelven a normal', () => { expect(difficulty('__proto__')).toBe('normal'); expect(difficulty('fast')).toBe('normal'); });
  it('modifica recursos, cañón y población de forma determinista por perfil', () => {
    const cadet = new Simulation(8042, 'combat-basic', 'cadet');
    const normal = new Simulation(8042, 'combat-basic', 'normal');
    const overdrive = new Simulation(8042, 'combat-basic', 'overdrive');
    expect(cadet.state).toMatchObject({ difficulty: 'cadet', lives: 4, bombs: 3 });
    expect(normal.state).toMatchObject({ difficulty: 'normal', lives: 3, bombs: 2 });
    expect(overdrive.state).toMatchObject({ difficulty: 'overdrive', lives: 1, bombs: 1 });
    expect(cadet.state.schedule.length).toBeLessThan(normal.state.schedule.length);
    expect(overdrive.state.schedule.length).toBeGreaterThan(normal.state.schedule.length);
    normal.update(1 / 60, { x: 0, y: 0, fire: true });
    expect(normal.state.shots[0]!.vx).toBeGreaterThan(0);
    expect(waveSchedule(4, 8042, 'expert')).toEqual(waveSchedule(4, 8042, 'expert'));
  });
});
