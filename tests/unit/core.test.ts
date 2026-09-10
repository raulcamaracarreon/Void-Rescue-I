import { describe, expect, it } from 'vitest';
import { FixedClock } from '../../src/core/Clock';
import { Random } from '../../src/core/Random';
import { nearCameraX, radarSegments, signedWrappedDeltaX, wrappedDistanceX, wrappedLerp, wrapX } from '../../src/core/WorldWrap';
import { CONFIG } from '../../src/game/config';
import { Simulation } from '../../src/game/Simulation';
import { Terrain } from '../../src/game/Terrain';
import { analogAxis, readGamepad } from '../../src/input/InputManager';
import { CameraRig } from '../../src/render/CameraRig';

describe('mundo circular', () => {
  it('normaliza incluso desplazamientos de varias vueltas', () => {
    expect(wrapX(-201, 100)).toBe(99);
    expect(wrapX(301, 100)).toBe(1);
    expect(wrapX(100, 100)).toBe(0);
  });
  it('usa la ruta corta para distancias, interpolación y representación', () => {
    expect(signedWrappedDeltaX(98, 2, 100)).toBe(4);
    expect(signedWrappedDeltaX(2, 98, 100)).toBe(-4);
    expect(wrappedDistanceX(98, 2, 100)).toBe(4);
    expect(wrappedLerp(98, 2, 0.5, 100)).toBe(0);
    expect(nearCameraX(2, 98, 100)).toBe(102);
  });
  it('divide el radar sin inventar una ventana en el centro', () => {
    const segments = radarSegments(0, 20, 100);
    expect(segments[0]).toEqual([0.9, 1]);
    expect(segments[1]![0]).toBe(0);
    expect(segments[1]![1]).toBeCloseTo(0.1);
    expect(radarSegments(99, 100, 100)).toEqual([[0, 1]]);
  });
  it('conserva continuidad de altura y pendiente del terreno', () => {
    const t = new Terrain(123);
    expect(t.height(0)).toBeCloseTo(t.height(CONFIG.worldWidth), 10);
    expect(t.height(-0.01)).toBeCloseTo(t.height(CONFIG.worldWidth - 0.01), 10);
    expect(t.height(0.01) - t.height(0)).toBeCloseTo(t.height(CONFIG.worldWidth + 0.01) - t.height(CONFIG.worldWidth), 10);
    expect(new Terrain(124).height(0)).not.toBeCloseTo(t.height(0));
  });
});

describe('paso fijo y determinismo', () => {
  it('genera secuencias repetibles sin depender de Math.random', () => {
    const a = new Random(42), b = new Random(42), c = new Random(43);
    const seq = Array.from({ length: 50 }, () => a.next());
    expect(seq).toEqual(Array.from({ length: 50 }, () => b.next()));
    expect(seq).not.toEqual(Array.from({ length: 50 }, () => c.next()));
  });
  it('produce el mismo estado a 30, 60 y 144 fps', () => {
    const states = [30, 60, 144].map(fps => {
      const s = new Simulation(42), clock = new FixedClock();
      for (let i = 0; i < fps * 3; i++) clock.advance(1 / fps, dt => s.update(dt, { x: 1, y: 0, fire: true }));
      return s.snapshot();
    });
    expect(states[0]).toEqual(states[1]);
    expect(states[1]).toEqual(states[2]);
    expect(states[0]!.frame).toBe(180);
  });
  it('limita la recuperación de una pestaña suspendida', () => {
    const clock = new FixedClock();
    let ticks = 0;
    clock.advance(90, () => ticks++);
    expect(ticks).toBe(6);
    expect(clock.droppedSeconds).toBeCloseTo(89.9);
    clock.reset();
    expect(clock.advance(0, () => ticks++)).toBe(0);
  });
});

describe('vuelo', () => {
  it('acelera, frena y orienta inmediatamente aunque conserve inercia', () => {
    const s = new Simulation();
    for (let i = 0; i < 180; i++) s.update(1 / 60, { x: 1, y: 0, fire: false });
    const speed = s.state.player.vx;
    expect(speed).toBeGreaterThan(60);
    expect(speed).toBeLessThanOrEqual(CONFIG.maxSpeed);
    s.update(1 / 60, { x: -1, y: 0, fire: false });
    expect(s.state.player.facing).toBe(-1);
    expect(s.state.player.vx).toBeGreaterThan(0);
    for (let i = 0; i < 180; i++) s.update(1 / 60, { x: 0, y: 0, fire: false });
    expect(s.state.player.vx).toBeLessThan(speed / 20);
  });
  it('limita la altura y libera el movimiento al invertir', () => {
    const s = new Simulation();
    for (let i = 0; i < 180; i++) s.update(1 / 60, { x: 0, y: 1, fire: false });
    expect(s.state.player.y).toBe(CONFIG.maxAltitude);
    expect(s.state.player.vy).toBe(0);
    s.update(1 / 60, { x: 0, y: -1, fire: false });
    expect(s.state.player.y).toBeLessThan(CONFIG.maxAltitude);
    for (let i = 0; i < 180; i++) s.update(1 / 60, { x: 0, y: -1, fire: false });
    expect(s.state.player.y).toBe(CONFIG.minAltitude);
  });
  it('cruza la costura en ambas direcciones sin saltos de cámara', () => {
    for (const direction of [-1, 1]) {
      const s = new Simulation(42, 'world-seam');
      if (direction < 0) s.state.player.x = 2;
      const camera = new CameraRig(s.state.player.x);
      for (let i = 0; i < 180; i++) {
        const previous = camera.x;
        s.update(1 / 60, { x: direction, y: 0, fire: false });
        camera.update(s.state.player.x, s.state.player.vx, s.state.player.facing, 1 / 60, false);
        expect(Math.abs(camera.x - previous)).toBeLessThan(2);
      }
      expect(s.state.laps).toBe(1);
    }
  });
  it('dispara hacia la orientación, limita cadencia y retira proyectiles', () => {
    const s = new Simulation();
    for (let i = 0; i < 60; i++) s.update(1 / 60, { x: -1, y: 0, fire: true });
    expect(s.state.shotsFired).toBe(7);
    expect(s.state.shots.every(shot => shot.vx < 0)).toBe(true);
    for (let i = 0; i < 90; i++) s.update(1 / 60, { x: 0, y: 0, fire: false });
    expect(s.state.shots).toHaveLength(0);
  });
  it('devuelve instantáneas sin acceso mutable al estado', () => {
    const s = new Simulation();
    s.snapshot().player.x = 0;
    expect(s.state.player.x).toBe(CONFIG.startX);
  });
});

describe('gamepad', () => {
  it('elimina deriva y conserva recorrido analógico', () => {
    expect(analogAxis(0.1)).toBe(0);
    expect(analogAxis(-1)).toBe(-1);
    expect(analogAxis(0.59)).toBeCloseTo(0.5);
  });
  it('lee stick, cruceta, disparo y pausa; desconexión queda neutral', () => {
    const buttons = Array.from({ length: 16 }, () => ({ pressed: false }));
    buttons[0]!.pressed = buttons[9]!.pressed = buttons[14]!.pressed = true;
    expect(readGamepad({ axes: [0.5, -1], buttons })).toEqual({ x: -1, y: 1, fire: true, pause: true });
    expect(readGamepad(null)).toEqual({ x: 0, y: -0, fire: false, pause: false });
  });
});
