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

function damageColonist(ctx: CombatContext, colonist: { id: number; x: number; y: number; owner: number | null; status: string; vy: number }): void {
  if (colonist.status === 'lost' || colonist.status === 'safe' || colonist.status === 'carried') return;
  if (colonist.owner !== null) {
    const captor = ctx.state.enemies.find(enemy => enemy.id === colonist.owner);
    if (captor) captor.target = null;
  }
  colonist.owner = null; colonist.status = 'lost'; colonist.vy = 0;
  ctx.emit('impact', colonist.x, colonist.y);
  ctx.emit('lost', colonist.x, colonist.y);
}

export function updateProjectiles(ctx: CombatContext, dt: number, view?: FlightInput['view']): void {
  const s = ctx.state;
  const viewCenter = view?.centerX ?? wrapX(s.player.x + s.player.facing * CONFIG.viewHeight * 16 / 9 / 4, CONFIG.worldWidth);
  const viewWidth = view?.width ?? CONFIG.viewHeight * 16 / 9;
  for (const shot of s.shots) {
    const dx = shot.vx * dt, dy = shot.vy * dt;
    if (shot.team === 'player') {
      // As in the reference game, player shots only resolve against enemies in
      // the main viewport, never against a radar-only contact.
      const hits = [
        ...s.enemies.filter(e => e.telegraph <= 0 && Math.abs(deltaX(viewCenter, e.x)) <= viewWidth / 2 + COMBAT.enemyRadius[e.kind]).map(enemy => ({ type: 'enemy' as const, target: enemy,
          t: sweptHit(shot.x, shot.y, dx, dy, enemy, COMBAT.enemyRadius[enemy.kind] + 0.4) })),
        // Civilians in the active combat space can be hit by defender fire.
        // Delivered and carried colonists remain protected to avoid retroactive
        // loss or immediate self-hits during a rescue.
        ...s.colonists.filter(colonist => !['lost', 'safe', 'carried'].includes(colonist.status) && Math.abs(deltaX(viewCenter, colonist.x)) <= viewWidth / 2 + COMBAT.colonistRadius).map(colonist => ({ type: 'colonist' as const, target: colonist,
          t: sweptHit(shot.x, shot.y, dx, dy, colonist, COMBAT.colonistRadius) })),
      ]
        .filter(hit => hit.t !== null).sort((a, b) => a.t! - b.t!);
      if (hits[0]) {
        if (hits[0].type === 'enemy') damageEnemy(ctx, hits[0].target, shot.damage ?? 1);
        else damageColonist(ctx, hits[0].target);
        shot.remaining = 0;
      }
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
