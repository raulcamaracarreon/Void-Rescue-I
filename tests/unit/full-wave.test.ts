import { expect, it } from 'vitest';
import { Simulation } from '../../src/game/Simulation';
import { pilot } from '../helpers/pilot';

it('puede completar la oleada principal mediante acciones ordinarias', () => {
  const s = new Simulation(8042, 'combat-basic');
  for (let frame = 0; frame < 60 * 240 && s.state.outcome === 'active'; frame++) s.update(1 / 60, pilot(s.state));
  expect({ outcome: s.state.outcome, kills: s.state.kills, delivered: s.state.delivered, time: s.state.time,
    remaining: s.state.enemies.map(e => ({ kind: e.kind, hp: e.hp })), player: s.state.player }).toMatchObject({ outcome: 'victory' });
  expect(s.state.spawnIndex).toBe(s.state.schedule.length);
  expect(s.state.summary?.survivors).toBeGreaterThan(0);
});
