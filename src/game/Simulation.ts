import { wrapX } from '../core/WorldWrap';
import { CONFIG } from './config';
import { Random } from '../core/Random';
import { Terrain } from './Terrain';
import type { CombatContext, CombatState } from './combat/types';
import { emptyCombat, resolveWave, updateWave } from './combat/WaveSystem';
import { initializeScenario } from './combat/scenarios';
import type { ScenarioName } from './combat/scenarios';
import { updateColonists } from './combat/ColonistSystem';
import { updateEnemies } from './combat/EnemySystem';
import { updateBomb, updateLife, updateProjectiles, useBomb } from './combat/CombatSystem';
import { advanceWave } from './combat/Progression';
export { SCENARIOS } from './combat/scenarios';
export type { ScenarioName } from './combat/scenarios';

export interface FlightInput { x: number; y: number; fire: boolean; bomb?: boolean; portal?: boolean; view?: { centerX: number; width: number } }
export const IDLE_INPUT: FlightInput = { x: 0, y: 0, fire: false };
export interface Player {
  x: number; y: number; previousX: number; previousY: number;
  vx: number; vy: number; facing: 1 | -1; thrust: number;
  alive: boolean; invulnerable: number;
}
export interface Shot { id: number; x: number; y: number; vx: number; vy: number; remaining: number; team: 'player' | 'enemy' }
export interface FlightState extends CombatState {
  seed: number; frame: number; time: number; distance: number; laps: number;
  player: Player; shots: Shot[]; shotsFired: number;
  scenario: ScenarioName;
}

export class Simulation {
  state: FlightState;
  private shotCooldown = 0;
  private nextId = 1;
  private bombHeld = false;
  private portalHeld = false;
  readonly context: CombatContext;

  constructor(seed = Number(CONFIG.defaultSeed), scenario: ScenarioName = 'flight-basic') {
    const x = scenario === 'world-seam' ? CONFIG.worldWidth - 2 : CONFIG.startX;
    this.state = {
      ...emptyCombat(scenario !== 'flight-basic' && scenario !== 'world-seam'),
      seed: seed >>> 0, frame: 0, time: 0, distance: 0, laps: 0, scenario,
      player: { x, y: CONFIG.startY, previousX: x, previousY: CONFIG.startY, vx: 0, vy: 0, facing: 1, thrust: 0, alive: true, invulnerable: 3 },
      shots: [], shotsFired: 0,
    };
    this.context = { state: this.state, terrain: new Terrain(seed), random: new Random(seed), nextId: () => this.nextId++,
      emit: (kind, x, y) => {
        this.state.events.push({ id: this.nextId++, kind, x, y, time: this.state.time });
        if (this.state.events.length > 80) this.state.events.shift();
      } };
    initializeScenario(this.context, scenario);
  }

  update(dt: number, input: FlightInput): void {
    const s = this.state;
    const p = s.player;
    if (s.enabled && s.outcome !== 'active') return;
    if (s.enabled) updateLife(this.context, dt);
    if (!p.alive) input = { ...IDLE_INPUT };
    p.previousX = p.x;
    p.previousY = p.y;
    const horizontal = Math.max(-1, Math.min(1, input.x));
    const vertical = Math.max(-1, Math.min(1, input.y));
    if (horizontal !== 0) p.facing = horizontal > 0 ? 1 : -1;
    p.thrust = Math.abs(horizontal);
    p.vx = Math.max(-CONFIG.maxSpeed, Math.min(CONFIG.maxSpeed,
      (p.vx + horizontal * CONFIG.acceleration * dt) * Math.exp(-CONFIG.drag * dt)));
    if (Math.abs(p.vx) < 0.01) p.vx = 0;
    p.vy += (vertical * CONFIG.verticalSpeed - p.vy) * (1 - Math.exp(-CONFIG.verticalResponse * dt));
    const unwrapped = p.x + p.vx * dt;
    if (unwrapped < 0 || unwrapped >= CONFIG.worldWidth) s.laps++;
    p.x = wrapX(unwrapped, CONFIG.worldWidth);
    const floor = s.enabled ? this.context.terrain.height(p.x) + 4.3 : CONFIG.minAltitude;
    p.y = Math.max(floor, Math.min(CONFIG.maxAltitude, p.y + p.vy * dt));
    if ((p.y === floor && p.vy < 0) || (p.y === CONFIG.maxAltitude && p.vy > 0)) p.vy = 0;
    s.distance += Math.abs(p.vx * dt);
    this.shotCooldown = Math.max(0, this.shotCooldown - dt);
    if (input.fire && p.alive && this.shotCooldown <= 1e-9) {
      this.shotCooldown = CONFIG.shotInterval;
      s.shotsFired++;
      s.shots.push({ id: this.nextId++, x: wrapX(p.x + p.facing * 5, CONFIG.worldWidth), y: p.y,
        vx: CONFIG.shotSpeed * p.facing + p.vx, vy: 0, team: 'player', remaining: CONFIG.shotLifetime });
    }
    if (s.enabled) {
      if (input.bomb && !this.bombHeld) useBomb(this.context, input);
      updateWave(this.context, dt, Boolean(input.portal && !this.portalHeld));
      updateEnemies(this.context, dt);
      updateBomb(this.context, dt);
      updateProjectiles(this.context, dt);
      updateColonists(this.context, dt);
      resolveWave(this.context);
    } else {
      for (const shot of s.shots) {
        shot.x = wrapX(shot.x + shot.vx * dt, CONFIG.worldWidth);
        shot.remaining -= dt;
      }
      s.shots = s.shots.filter(shot => shot.remaining > 0);
    }
    this.bombHeld = Boolean(input.bomb); this.portalHeld = Boolean(input.portal);
    s.frame++;
    s.time = s.frame / 60;
  }

  nextWave(): boolean {
    if (!advanceWave(this.context)) return false;
    this.shotCooldown = 0; this.bombHeld = false; this.portalHeld = false;
    return true;
  }

  snapshot(): FlightState { return structuredClone(this.state); }
}
