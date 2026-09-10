import type { Random } from '../../core/Random';
import type { FlightState } from '../Simulation';
import type { Terrain } from '../Terrain';

export type EnemyKind = 'harvester' | 'wraith' | 'interceptor' | 'flux' | 'drone';
export type ColonistStatus = 'ground' | 'targeted' | 'captured' | 'falling' | 'carried' | 'safe' | 'lost';
export interface Colonist {
  id: number; x: number; y: number; vy: number; status: ColonistStatus;
  owner: number | null; homeX: number; walkDirection: number; rescued: boolean;
}
export interface Enemy {
  id: number; kind: EnemyKind; x: number; y: number; vx: number; vy: number;
  hp: number; target: number | null; phase: 'seek' | 'descend' | 'lift' | 'hunt';
  cooldown: number; age: number; telegraph: number;
}
export type EventKind = 'spawn' | 'capture' | 'falling' | 'landing' | 'rescue' | 'delivery' | 'lost' | 'mutation'
  | 'explosion' | 'impact' | 'bomb-charge' | 'bomb' | 'portal' | 'player-hit' | 'respawn' | 'victory' | 'defeat';
export interface GameEvent { id: number; kind: EventKind; x: number; y: number; time: number }
export interface SpawnEntry { at: number; kind: EnemyKind; x: number; y: number }
export interface CombatState {
  enabled: boolean; outcome: 'active' | 'victory' | 'defeat';
  colonists: Colonist[]; enemies: Enemy[]; events: GameEvent[];
  schedule: SpawnEntry[]; spawnIndex: number; score: number; kills: number;
  delivered: number; lives: number; bombs: number; respawnTimer: number;
  portal: { x: number; y: number; ready: boolean; used: boolean; cooldown: number };
  bomb: { remaining: number; x: number; y: number; centerX: number; width: number } | null;
  summary: { survivors: number; lost: number; rescued: number; score: number; time: number; bonus: number } | null;
  colonyLost: boolean;
}
export interface CombatContext {
  state: FlightState; terrain: Terrain; random: Random;
  nextId(): number; emit(kind: EventKind, x: number, y: number): void;
}

export const COMBAT = {
  colonistX: [400, 480, 640, 820, 1080, 1430, 1790, 2160],
  gravity: 5.5, safeFallSpeed: 9, rescueRadius: 5.5, deliverySpeed: 22,
  descentSpeed: 8, liftSpeed: 5, abductionY: 83, playerRadius: 2.4,
  enemyRadius: { harvester: 3.3, wraith: 3.5, interceptor: 3, flux: 4.5, drone: 1.4 },
  enemyHp: { harvester: 2, wraith: 3, interceptor: 2, flux: 8, drone: 1 },
  points: { harvester: 150, wraith: 250, interceptor: 200, flux: 500, drone: 50 },
  catchPoints: 500, deliveryPoints: 500, survivorBonus: 300, portalBonus: 1000,
  respawnSeconds: 1.6, invulnerability: 3, bombCharge: 0.25,
} as const;
