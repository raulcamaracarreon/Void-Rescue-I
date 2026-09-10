import { wrapX } from '../../core/WorldWrap';
import { CONFIG } from '../config';
import { COMBAT } from './types';
import type { CombatContext, Enemy, EnemyKind } from './types';
import { deltaX, distance } from './spatial';
import { releaseTarget } from './ColonistSystem';
import { wavePressure } from './Progression';
import { difficultyProfile } from '../Difficulty';

export function spawnEnemy(ctx: CombatContext, kind: EnemyKind, x: number, y: number, telegraph = 0.65): Enemy {
  const enemy: Enemy = { id: ctx.nextId(), kind, x: wrapX(x, CONFIG.worldWidth), y, vx: 0, vy: 0,
    hp: COMBAT.enemyHp[kind], target: null, phase: kind === 'harvester' ? 'seek' : 'hunt',
    cooldown: (2 + ctx.random.next()) / difficultyProfile(ctx.state.difficulty).enemyFireRate, age: 0, telegraph };
  ctx.state.enemies.push(enemy); ctx.emit('spawn', enemy.x, enemy.y); return enemy;
}

export function updateEnemies(ctx: CombatContext, dt: number): void {
  const s = ctx.state, p = s.player;
  const realDt = dt, pressure = wavePressure(s.wave), profile = difficultyProfile(s.difficulty);
  dt *= pressure * profile.enemySpeed;
  for (const e of [...s.enemies]) {
    e.age += dt;
    if (e.telegraph > 0) { e.telegraph = Math.max(0, e.telegraph - dt); continue; }
    const beforeX = e.x, beforeY = e.y;
    if (e.kind === 'harvester') {
      let c = s.colonists.find(c => c.id === e.target && c.owner === e.id && c.status !== 'lost');
      if (!c) {
        releaseTarget(ctx, e);
        c = s.colonists.filter(c => c.status === 'ground' && c.owner === null)
          .sort((a, b) => Math.abs(deltaX(e.x, a.x)) - Math.abs(deltaX(e.x, b.x)))[0];
        if (c) { c.owner = e.id; c.status = 'targeted'; e.target = c.id; e.phase = 'descend'; }
      }
      if (c) {
        if (e.phase === 'lift') {
          e.y += COMBAT.liftSpeed * dt; c.x = e.x; c.y = e.y - 5;
          if (e.y >= COMBAT.abductionY) {
            c.status = 'lost'; c.owner = null; e.target = null; e.kind = 'wraith';
            e.hp = COMBAT.enemyHp.wraith; e.phase = 'hunt'; ctx.emit('mutation', e.x, e.y);
          }
        } else {
          const dx = deltaX(e.x, c.x);
          e.x = wrapX(e.x + Math.max(-16 * dt, Math.min(16 * dt, dx)), CONFIG.worldWidth);
          const targetY = c.y + 5;
          e.y += Math.max(-COMBAT.descentSpeed * dt, Math.min(COMBAT.descentSpeed * dt, targetY - e.y));
          if (Math.abs(dx) < 1.2 && Math.abs(e.y - targetY) < 0.4) {
            e.phase = 'lift'; c.status = 'captured'; ctx.emit('capture', c.x, c.y);
          }
        }
      } else {
        e.x = wrapX(e.x + Math.sign(deltaX(e.x, p.x)) * 10 * dt, CONFIG.worldWidth);
        e.y += (60 - e.y) * dt;
      }
    } else {
      const dx = deltaX(e.x, p.x), dy = p.y - e.y;
      const rage = s.colonyLost ? 1.25 : 1;
      const kindSpeed = e.kind === 'wraith' ? 24 : e.kind === 'interceptor' ? 19 : e.kind === 'crossfire' ? 15 : e.kind === 'drone' ? 26 : 7;
      const length = Math.hypot(dx, dy) || 1;
      if (e.kind === 'flux') {
        e.x = wrapX(e.x + Math.sign(dx) * kindSpeed * dt, CONFIG.worldWidth);
        e.y += (58 + Math.sin(e.age * 0.8) * 7 - e.y) * dt * 0.6;
      } else {
        const strafe = (e.kind === 'interceptor' || e.kind === 'crossfire') && Math.abs(dx) < 30 ? -1 : 1;
        e.x = wrapX(e.x + dx / length * kindSpeed * rage * dt * strafe, CONFIG.worldWidth);
        const jitter = e.kind === 'wraith' ? Math.sin(e.age * 7 + e.id) * 7 : 0;
        e.y += (dy / length * kindSpeed * 0.8 * rage + jitter) * dt;
      }
      e.y = Math.max(ctx.terrain.height(e.x) + 6, Math.min(CONFIG.maxAltitude, e.y));
      e.cooldown -= realDt * pressure;
      if (e.cooldown <= 0 && p.alive) {
        e.cooldown = (e.kind === 'flux' ? 5 : e.kind === 'crossfire' ? 2.1 + ctx.random.next() * 0.6 : 2.8 + ctx.random.next()) / profile.enemyFireRate;
        if (e.kind === 'flux' && s.enemies.filter(e => e.kind === 'drone').length < 3) {
          spawnEnemy(ctx, 'drone', e.x, e.y - 4, 0.4);
        } else if (e.kind === 'crossfire' && distance(e, p) < 135) {
          // This enemy's hull is horizontal; its paired shots travel along the
          // perpendicular vertical axis, independently of the player's position.
          const speed = 34 * pressure * profile.enemyShotSpeed;
          s.shots.push(
            { id: ctx.nextId(), x: e.x, y: e.y, vx: 0, vy: speed, remaining: 4, team: 'enemy' },
            { id: ctx.nextId(), x: e.x, y: e.y, vx: 0, vy: -speed, remaining: 4, team: 'enemy' },
          );
        } else if (e.kind !== 'drone' && distance(e, p) < 135) {
          const speed = 38 * pressure * profile.enemyShotSpeed;
          s.shots.push({ id: ctx.nextId(), x: e.x, y: e.y, vx: dx / length * speed, vy: dy / length * speed,
            remaining: 4, team: 'enemy' });
        }
      }
    }
    e.vx = deltaX(beforeX, e.x) / realDt; e.vy = (e.y - beforeY) / realDt;
  }
}
