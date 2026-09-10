import { COMBAT } from './types';
import type { CombatContext } from './types';
import { spawnEnemy } from './EnemySystem';

export const SCENARIOS = ['flight-basic', 'world-seam', 'combat-basic', 'abduction-start', 'falling-colonist',
  'portal-ready', 'wave-near-complete', 'player-near-death', 'last-life', 'combat-showcase'] as const;
export type ScenarioName = typeof SCENARIOS[number];

export function initializeScenario(ctx: CombatContext, name: ScenarioName): void {
  const s = ctx.state, p = s.player;
  if (!s.enabled) return;
  s.colonists = COMBAT.colonistX.map((x, i) => ({ id: ctx.nextId(), x, y: ctx.terrain.height(x) + 1.5,
    vy: 0, status: 'ground', owner: null, homeX: x, walkDirection: i % 2 ? 1 : -1, rescued: false }));
  if (name === 'combat-basic') {
    s.schedule = [
      { at: 2, kind: 'harvester', x: 400, y: 70 }, { at: 7, kind: 'interceptor', x: 510, y: 56 },
      { at: 11, kind: 'harvester', x: 480, y: 76 }, { at: 17, kind: 'harvester', x: 640, y: 72 },
      { at: 23, kind: 'interceptor', x: 810, y: 66 }, { at: 29, kind: 'flux', x: 900, y: 64 },
      { at: 34, kind: 'harvester', x: 1080, y: 76 }, { at: 41, kind: 'harvester', x: 1430, y: 72 },
      { at: 47, kind: 'interceptor', x: 1680, y: 60 },
    ];
    return;
  }
  p.invulnerable = 0;
  const c = s.colonists[0]!;
  if (name === 'combat-showcase') {
    // Diagnostic composition using the same entities and AI as the main wave.
    p.invulnerable = 10;
    c.x = c.homeX = 300; c.y = ctx.terrain.height(c.x) + 1.5;
    spawnEnemy(ctx, 'harvester', 300, 40, 0);
    spawnEnemy(ctx, 'wraith', 320, 72, 0);
    spawnEnemy(ctx, 'interceptor', 420, 68, 0);
    spawnEnemy(ctx, 'flux', 430, 44, 0);
    spawnEnemy(ctx, 'drone', 395, 28, 0);
    const falling = s.colonists[1]!;
    falling.x = 410; falling.y = 33; falling.status = 'falling';
    s.colonists[2]!.status = 'safe'; s.delivered = 1; s.portal.ready = true;
  }
  if (name === 'abduction-start') {
    const e = spawnEnemy(ctx, 'harvester', c.x, c.y + 5.3, 0);
    e.target = c.id; e.phase = 'descend'; c.owner = e.id; c.status = 'targeted';
    p.y = p.previousY = c.y + 15;
  }
  if (name === 'falling-colonist') {
    c.x = 374; c.y = 53; c.vy = -2; c.status = 'falling';
    p.y = p.previousY = 48;
    spawnEnemy(ctx, 'flux', 900, 65, 0);
  }
  if (name === 'portal-ready') {
    c.status = 'safe'; c.rescued = true; s.delivered = 1; s.portal.ready = true;
    p.x = p.previousX = s.portal.x - 5; p.y = p.previousY = s.portal.y;
    spawnEnemy(ctx, 'harvester', 1000, 65, 0);
  }
  if (name === 'wave-near-complete') {
    const e = spawnEnemy(ctx, 'interceptor', p.x + 34, p.y, 0); e.hp = 1; e.cooldown = 99;
  }
  if (name === 'player-near-death' || name === 'last-life') {
    s.lives = name === 'last-life' ? 1 : 2;
    spawnEnemy(ctx, 'flux', 1000, 64, 0);
    s.shots.push({ id: ctx.nextId(), x: p.x + 9, y: p.y, vx: -38, vy: 0, remaining: 1, team: 'enemy' });
  }
}
