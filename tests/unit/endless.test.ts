import { expect, it } from 'vitest';
import { Simulation, IDLE_INPUT } from '../../src/game/Simulation';
import { resolveWave } from '../../src/game/combat/WaveSystem';
import { wavePressure, waveSchedule } from '../../src/game/combat/Progression';
import { Records, RECORDS_KEY, pilotName } from '../../src/game/Records';
import type { PlayerRecord } from '../../src/game/Records';
import { pilot } from '../helpers/pilot';

it('completa tres oleadas sucesivas con controles ordinarios y puntos acumulados', () => {
  const sim = new Simulation(8042, 'combat-basic');
  let previousScore = 0;
  for (let wave = 1; wave <= 3; wave++) {
    for (let f = 0; f < 60 * 300 && sim.state.outcome === 'active'; f++) sim.update(1 / 60, pilot(sim.state));
    expect({ wave, outcome: sim.state.outcome, enemies: sim.state.enemies.length, lives: sim.state.lives }).toMatchObject({ outcome: 'victory' });
    expect(sim.state.score).toBeGreaterThan(previousScore); previousScore = sim.state.score;
    expect(sim.state.summary!.time).toBeCloseTo(sim.state.time - sim.state.waveStartedAt, 1);
    expect(sim.nextWave()).toBe(true);
  }
  expect(sim.state.wave).toBe(4);
});

it('transiciones repetidas conservan recursos y reinician amenazas, reloj de oleada y bono', () => {
  const sim = new Simulation(8042, 'combat-basic');
  expect(sim.nextWave()).toBe(false);
  sim.state.lives = 1; sim.state.bombs = 0;
  const ids = new Set<number>();
  for (let wave = 1; wave <= 100; wave++) {
    const s = sim.state;
    for (const c of s.colonists) { expect(ids.has(c.id)).toBe(false); ids.add(c.id); }
    s.time = s.waveStartedAt + 20; s.frame = s.time * 60;
    s.spawnIndex = s.schedule.length; s.enemies = [];
    const before = s.score;
    resolveWave(sim.context); resolveWave(sim.context);
    expect(s.summary).toMatchObject({ time: 20, bonus: 4000, score: before + 4000 });
    s.portal.ready = s.portal.used = true; s.colonyLost = true;
    expect(sim.nextWave()).toBe(true);
    expect(s.score).toBe(before + 4000); expect(s.wave).toBe(wave + 1);
    expect(s.bombs).toBe(Math.min(3, wave)); expect(s.lives).toBe(Math.min(3, 1 + Math.floor(wave / 3)));
    expect(s.colonists.every(c => c.status === 'ground')).toBe(true);
    expect(s.portal.ready).toBe(false); expect(s.colonyLost).toBe(false);
    expect(s.shots).toHaveLength(0); expect(s.events).toHaveLength(0); expect(s.summary).toBeNull();
    sim.update(1 / 60, IDLE_INPUT);
    expect(s.spawnIndex).toBe(0); // Global time must not release the entire next schedule.
  }
});

it('presión creciente y horarios deterministas mantienen límites incluso en oleadas muy altas', () => {
  expect(wavePressure(1)).toBe(1);
  for (const wave of [2, 10, 100, 1000, 1000000]) {
    expect(wavePressure(wave)).toBeGreaterThan(wavePressure(wave - 1));
    expect(wavePressure(wave)).toBeLessThan(1.8);
    const schedule = waveSchedule(wave, 8042);
    expect(schedule).toEqual(waveSchedule(wave, 8042));
    expect(schedule).not.toEqual(waveSchedule(wave, 23));
    expect(schedule.length).toBeLessThanOrEqual(33);
    expect(schedule.every((e, i) => Number.isFinite(e.at) && e.x >= 0 && e.x < 2400 && (i === 0 || e.at > schedule[i - 1]!.at))).toBe(true);
  }
});

it('derrota no permite continuar con naves gratuitas', () => {
  const sim = new Simulation(8042, 'last-life');
  for (let i = 0; i < 60; i++) sim.update(1 / 60, IDLE_INPUT);
  expect(sim.state.outcome).toBe('defeat'); expect(sim.nextWave()).toBe(false);
});

function memory() {
  const data = new Map<string, string>();
  return { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => { data.set(key, value); } };
}
const record = (id = 'run1', score = 1200): PlayerRecord => ({ id, score, pilot: 'RAU', wave: 1, difficulty: 'normal', date: '2026-09-10T00:00:00.000Z' });

it('récord por partida se actualiza, conserva iniciales y persiste tras recargar', () => {
  const storage = memory(), records = new Records(storage);
  records.setPilot('RAU'); records.save(record());
  records.save({ ...record(), score: 4500, wave: 2, difficulty: 'relaxed' });
  records.save(record()); // An older snapshot cannot lower a record.
  const reloaded = new Records(storage);
  expect(reloaded.pilot).toBe('RAU'); expect(reloaded.list()).toEqual([{ ...record(), score: 4500, wave: 2, difficulty: 'relaxed' }]);
  reloaded.list()[0]!.score = 99999;
  expect(reloaded.list()[0]!.score).toBe(4500);
});

it('top diez ordenado, desempate por oleada y recuperación de partida expulsada', () => {
  const records = new Records(memory());
  for (let i = 0; i < 15; i++) records.save(record(`run${i}`, i * 100 + 100));
  expect(records.list()).toHaveLength(10); expect(records.list()[0]!.score).toBe(1500);
  records.save({ ...record('run0', 1500), wave: 3 });
  expect(records.list()[0]!.id).toBe('run0'); expect(records.list()).toHaveLength(10);
});

it('dos instancias abiertas conservan los récords guardados desde la otra', () => {
  const storage = memory(), first = new Records(storage), second = new Records(storage);
  first.save(record('a', 1000)); second.save(record('b', 2000));
  expect(first.list().map(r => r.id)).toEqual(['b', 'a']);
  first.save(record('a', 3000));
  expect(second.list().map(r => r.score)).toEqual([3000, 2000]);
});

it('rechaza datos inválidos, duplicados y nombres con markup sin bloquear el juego', () => {
  const storage = memory();
  storage.setItem(RECORDS_KEY, JSON.stringify([record(), record(), { ...record('bad'), pilot: '<b>' }, { ...record('bad2'), score: -1 }, { ...record('bad3'), difficulty: 'constructor' }]));
  const records = new Records(storage);
  expect(records.list()).toHaveLength(1);
  records.save({ ...record(), score: NaN }); expect(records.list()).toHaveLength(1);
  storage.setItem(RECORDS_KEY, '{bad'); expect(new Records(storage).list()).toEqual([]);
  expect(pilotName('<script>')).toBe('VR1');
});

it('almacenamiento bloqueado mantiene récords de sesión e informa el fallo', () => {
  const records = new Records({ getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('full'); } });
  records.save(record()); expect(records.list()).toHaveLength(1); expect(records.persistent).toBe(false);
});
