import type { FlightInput, FlightState } from '../../src/game/Simulation';
import { deltaX, distance } from '../../src/game/combat/spatial';

/** Test pilot only: observes public state and returns ordinary input actions. */
export function pilot(s: FlightState): FlightInput {
  const p = s.player;
  let dx = 0, targetY = 48, targetVx = 0;
  const carried = s.colonists.some(c => c.status === 'carried');
  const falling = s.colonists.filter(c => c.status === 'falling').sort((a, b) => distance(p, a) - distance(p, b))[0];
  const enemy = [...s.enemies].sort((a, b) => distance(p, a) - distance(p, b))[0];
  if (carried) targetY = 0;
  else if (falling && Math.abs(deltaX(p.x, falling.x)) < 95) { dx = deltaX(p.x, falling.x); targetY = falling.y - 2; }
  else if (enemy) {
    const side = deltaX(p.x, enemy.x) >= 0 ? 1 : -1;
    dx = deltaX(p.x, enemy.x) - side * 35;
    targetVx = enemy.vx;
    targetY = enemy.y + enemy.vy * Math.min(0.25, Math.abs(deltaX(p.x, enemy.x)) / 180);
  }
  const desiredVx = Math.max(-55, Math.min(55, dx * 2 + targetVx));
  let x = Math.abs(desiredVx - p.vx) > 4 ? Math.sign(desiredVx - p.vx) : 0;
  // When near the firing position, brief facing changes aim without building speed.
  if (!carried && enemy && Math.abs(dx) < 8 && p.facing !== Math.sign(deltaX(p.x, enemy.x))) x = Math.sign(deltaX(p.x, enemy.x));
  const y = Math.abs(targetY - p.y) > 1.3 ? Math.sign(targetY - p.y) : 0;
  const danger = s.shots.some(shot => shot.team === 'enemy' && distance(p, shot) < 18);
  const bomb = Boolean(enemy && (s.enemies.filter(e => distance(p, e) < 80).length >= 3 || (enemy.kind === 'flux' && distance(p, enemy) < 75) || danger));
  return { x, y, fire: !carried && !falling, bomb, portal: false };
}
