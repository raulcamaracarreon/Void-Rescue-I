import { wrapX } from '../../core/WorldWrap';
import { CONFIG } from '../config';
import type { FlightInput } from '../Simulation';
import { COMBAT } from './types';
import type { CombatContext, Enemy } from './types';
import { deltaX, distance, sweptHit } from './spatial';
import { releaseTarget } from './ColonistSystem';

export function damageEnemy(ctx: CombatContext, enemy: Enemy, damage: number): void {
  if (enemy.hp <= 0 || enemy.telegraph > 0) return;
  enemy.hp -= damage;
  ctx.emit(enemy.hp <= 0 ? 'explosion' : 'impact', enemy.x, enemy.y);
  if (enemy.hp <= 0) {
    releaseTarget(ctx, enemy); ctx.state.score += COMBAT.points[enemy.kind]; ctx.state.kills++;
    ctx.state.enemies = ctx.state.enemies.filter(e => e.id !== enemy.id);
  }
}

export function hitPlayer(ctx: CombatContext): void {
  const s = ctx.state, p = s.player;
  if (!p.alive || p.invulnerable > 0 || s.outcome !== 'active') return;
  p.alive = false; p.vx = 0; p.vy = 0; s.lives--;
  s.respawnTimer = COMBAT.respawnSeconds; ctx.emit('player-hit', p.x, p.y);
  for (const c of s.colonists.filter(c => c.status === 'carried')) { c.status = 'falling'; c.vy = 0; }
  if (s.lives <= 0) { s.outcome = 'defeat'; ctx.emit('defeat', p.x, p.y); }
}

export function updateLife(ctx: CombatContext, dt: number): void {
  const s = ctx.state, p = s.player;
  p.invulnerable = Math.max(0, p.invulnerable - dt);
  if (p.alive || s.outcome !== 'active') return;
  s.respawnTimer -= dt;
  if (s.respawnTimer <= 0) {
    // Prefer the death location; choose another region if enemies would camp it.
    let x = p.x;
    if (s.enemies.some(e => Math.abs(deltaX(x, e.x)) < 55)) {
      x = Array.from({ length: 16 }, (_, i) => wrapX(p.x + i * 150, CONFIG.worldWidth))
        .sort((a, b) => nearest(ctx, b) - nearest(ctx, a))[0]!;
    }
    p.x = p.previousX = x; p.y = p.previousY = CONFIG.startY;
    p.alive = true; p.invulnerable = COMBAT.invulnerability;
    ctx.emit('respawn', p.x, p.y);
  }
}
function nearest(ctx: CombatContext, x: number): number {
  return Math.min(CONFIG.worldWidth, ...ctx.state.enemies.map(e => Math.abs(deltaX(x, e.x))));
}

export function updateProjectiles(ctx: CombatContext, dt: number): void {
  const s = ctx.state;
  for (const shot of s.shots) {
    const dx = shot.vx * dt, dy = shot.vy * dt;
    if (shot.team === 'player') {
      const hits = s.enemies.filter(e => e.telegraph <= 0).map(enemy => ({ enemy,
        t: sweptHit(shot.x, shot.y, dx, dy, enemy, COMBAT.enemyRadius[enemy.kind] + 0.4) }))
        .filter(hit => hit.t !== null).sort((a, b) => a.t! - b.t!);
      if (hits[0]) { damageEnemy(ctx, hits[0].enemy, 1); shot.remaining = 0; }
    } else if (s.player.alive && sweptHit(shot.x, shot.y, dx, dy, s.player, COMBAT.playerRadius) !== null) {
      hitPlayer(ctx); shot.remaining = 0;
    }
    shot.x = wrapX(shot.x + dx, CONFIG.worldWidth); shot.y += dy; shot.remaining -= dt;
    if (shot.y < ctx.terrain.height(shot.x) || shot.y > 100) shot.remaining = 0;
  }
  s.shots = s.shots.filter(shot => shot.remaining > 0);
  for (const e of s.enemies) if (e.telegraph <= 0 && distance(e, s.player) < COMBAT.enemyRadius[e.kind] + COMBAT.playerRadius) hitPlayer(ctx);
}

export function useBomb(ctx: CombatContext, input: FlightInput): void {
  const s = ctx.state, p = s.player;
  if (!p.alive || s.bombs <= 0 || s.bomb) return;
  s.bombs--;
  s.bomb = { remaining: COMBAT.bombCharge, x: p.x, y: p.y,
    centerX: input.view?.centerX ?? p.x + p.facing * 9 + p.vx * 0.17,
    width: input.view?.width ?? CONFIG.viewHeight * 16 / 9 };
  ctx.emit('bomb-charge', p.x, p.y);
}

export function updateBomb(ctx: CombatContext, dt: number): void {
  const s = ctx.state, bomb = s.bomb;
  if (!bomb) return;
  bomb.remaining -= dt;
  if (bomb.remaining > 0) return;
  for (const e of [...s.enemies]) if (Math.abs(deltaX(bomb.centerX, e.x)) <= bomb.width / 2 && e.y >= 0 && e.y <= 100) damageEnemy(ctx, e, 20);
  s.shots = s.shots.filter(shot => shot.team === 'player' || Math.abs(deltaX(bomb.centerX, shot.x)) > bomb.width / 2);
  ctx.emit('bomb', bomb.x, bomb.y); s.bomb = null;
}
