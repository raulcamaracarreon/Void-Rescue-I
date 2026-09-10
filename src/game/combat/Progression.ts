import { Random } from '../../core/Random';
import { CONFIG } from '../config';
import { COMBAT } from './types';
import type { CombatContext, EnemyKind, SpawnEntry } from './types';

// Pressure keeps increasing, approaching 1.8×; bounded populations protect long runs.
export function wavePressure(wave: number): number {
  return 1 + 0.8 * (wave - 1) / (wave + 9);
}

export function waveSchedule(wave: number, seed: number): SpawnEntry[] {
  if (wave === 1) return [
    { at: 2, kind: 'harvester', x: 400, y: 70 }, { at: 7, kind: 'interceptor', x: 510, y: 56 },
    { at: 11, kind: 'harvester', x: 480, y: 76 }, { at: 17, kind: 'harvester', x: 640, y: 72 },
    { at: 23, kind: 'interceptor', x: 810, y: 66 }, { at: 29, kind: 'flux', x: 900, y: 64 },
    { at: 34, kind: 'harvester', x: 1080, y: 76 }, { at: 41, kind: 'harvester', x: 1430, y: 72 },
    { at: 47, kind: 'interceptor', x: 1680, y: 60 },
  ];
  const random = new Random((seed ^ Math.imul(wave, 0x9e3779b9)) >>> 0);
  const kinds: EnemyKind[] = ['harvester', 'interceptor', 'harvester', 'wraith', 'interceptor', 'flux'];
  return Array.from({ length: Math.min(33, 9 + (wave - 1) * 2) }, (_, i) => ({
    at: 2 + i * 5 / wavePressure(wave), kind: kinds[i % kinds.length]!,
    x: (CONFIG.startX + 100 + i * 139 + random.next() * 100) % CONFIG.worldWidth,
    y: 58 + random.next() * 20,
  }));
}

export function populateColonists(ctx: CombatContext): void {
  ctx.state.colonists = COMBAT.colonistX.map((x, i) => ({ id: ctx.nextId(), x, y: ctx.terrain.height(x) + 1.5,
    vy: 0, status: 'ground', owner: null, homeX: x, walkDirection: i % 2 ? 1 : -1, rescued: false }));
}

export function advanceWave(ctx: CombatContext): boolean {
  const s = ctx.state;
  if (!s.enabled || s.outcome !== 'victory' || !s.summary) return false;
  s.wave++;
  s.waveStartedAt = s.time;
  s.outcome = 'active'; s.summary = null;
  s.enemies = []; s.shots = []; s.events = []; s.bomb = null;
  s.delivered = 0; s.colonyLost = false; s.respawnTimer = 0;
  s.bombs = Math.min(3, s.bombs + 1);
  if ((s.wave - 1) % 3 === 0) s.lives = Math.min(3, s.lives + 1);
  s.portal = { x: 330, y: 46, ready: false, used: false, cooldown: 0 };
  Object.assign(s.player, { x: CONFIG.startX, previousX: CONFIG.startX, y: CONFIG.startY,
    previousY: CONFIG.startY, vx: 0, vy: 0, facing: 1, thrust: 0, alive: true, invulnerable: COMBAT.invulnerability });
  populateColonists(ctx);
  s.schedule = waveSchedule(s.wave, s.seed); s.spawnIndex = 0;
  return true;
}
