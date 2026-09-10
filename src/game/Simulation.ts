import { wrapX } from '../core/WorldWrap';
import { CONFIG } from './config';

export interface FlightInput { x: number; y: number; fire: boolean }
export const IDLE_INPUT: FlightInput = { x: 0, y: 0, fire: false };
export interface Player {
  x: number; y: number; previousX: number; previousY: number;
  vx: number; vy: number; facing: 1 | -1; thrust: number;
}
export interface Shot { id: number; x: number; y: number; vx: number; remaining: number }
export interface FlightState {
  seed: number; frame: number; time: number; distance: number; laps: number;
  player: Player; shots: Shot[]; shotsFired: number;
  scenario: ScenarioName;
}
export const SCENARIOS = ['flight-basic', 'world-seam'] as const;
export type ScenarioName = typeof SCENARIOS[number];

export class Simulation {
  state: FlightState;
  private shotCooldown = 0;
  private nextId = 1;

  constructor(seed = Number(CONFIG.defaultSeed), scenario: ScenarioName = 'flight-basic') {
    const x = scenario === 'world-seam' ? CONFIG.worldWidth - 2 : CONFIG.startX;
    this.state = {
      seed: seed >>> 0, frame: 0, time: 0, distance: 0, laps: 0, scenario,
      player: { x, y: CONFIG.startY, previousX: x, previousY: CONFIG.startY, vx: 0, vy: 0, facing: 1, thrust: 0 },
      shots: [], shotsFired: 0,
    };
  }

  update(dt: number, input: FlightInput): void {
    const s = this.state;
    const p = s.player;
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
    p.y = Math.max(CONFIG.minAltitude, Math.min(CONFIG.maxAltitude, p.y + p.vy * dt));
    if ((p.y === CONFIG.minAltitude && p.vy < 0) || (p.y === CONFIG.maxAltitude && p.vy > 0)) p.vy = 0;
    s.distance += Math.abs(p.vx * dt);
    this.shotCooldown = Math.max(0, this.shotCooldown - dt);
    if (input.fire && this.shotCooldown <= 1e-9) {
      this.shotCooldown = CONFIG.shotInterval;
      s.shotsFired++;
      s.shots.push({ id: this.nextId++, x: wrapX(p.x + p.facing * 5, CONFIG.worldWidth), y: p.y,
        vx: CONFIG.shotSpeed * p.facing + p.vx, remaining: CONFIG.shotLifetime });
    }
    for (const shot of s.shots) {
      shot.x = wrapX(shot.x + shot.vx * dt, CONFIG.worldWidth);
      shot.remaining -= dt;
    }
    s.shots = s.shots.filter(shot => shot.remaining > 0);
    s.frame++;
    s.time = s.frame / 60;
  }

  snapshot(): FlightState { return structuredClone(this.state); }
}
