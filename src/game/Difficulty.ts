export interface DifficultyProfile {
  label: string;
  rank: number;
  /** Pasos fijos de simulación por segundo real. */
  speed: number;
  startingLives: number;
  lifeCap: number;
  startingBombs: number;
  bombCap: number;
  playerShotInterval: number;
  playerShotSpeed: number;
  enemyHitsToKill: number;
  enemyCount: number;
  enemySpeed: number;
  enemyFireRate: number;
  enemyShotSpeed: number;
}

// Each profile changes the whole encounter, rather than only accelerating the
// same simulation. `normal` keeps the original resources and combat values
// while raising the real-time arcade pace to 1.2×.
export const DIFFICULTIES = {
  cadet: { label: 'Recluta', rank: 0, speed: 0.9, startingLives: 4, lifeCap: 4, startingBombs: 3, bombCap: 3,
    playerShotInterval: 0.11, playerShotSpeed: 1.15, enemyHitsToKill: 1, enemyCount: 0.75, enemySpeed: 0.75, enemyFireRate: 0.7, enemyShotSpeed: 0.75 },
  relaxed: { label: 'Relajado', rank: 1, speed: 1, startingLives: 4, lifeCap: 4, startingBombs: 3, bombCap: 3,
    playerShotInterval: 0.13, playerShotSpeed: 1.08, enemyHitsToKill: 1, enemyCount: 0.9, enemySpeed: 0.9, enemyFireRate: 0.85, enemyShotSpeed: 0.9 },
  normal: { label: 'Normal', rank: 2, speed: 1.2, startingLives: 3, lifeCap: 3, startingBombs: 2, bombCap: 3,
    playerShotInterval: 0.15, playerShotSpeed: 1, enemyHitsToKill: 2, enemyCount: 1, enemySpeed: 1, enemyFireRate: 1, enemyShotSpeed: 1 },
  hard: { label: 'Difícil', rank: 3, speed: 1.4, startingLives: 3, lifeCap: 3, startingBombs: 2, bombCap: 3,
    playerShotInterval: 0.17, playerShotSpeed: 0.95, enemyHitsToKill: 2, enemyCount: 1.2, enemySpeed: 1.15, enemyFireRate: 1.2, enemyShotSpeed: 1.15 },
  expert: { label: 'Experto', rank: 4, speed: 1.6, startingLives: 2, lifeCap: 2, startingBombs: 1, bombCap: 2,
    playerShotInterval: 0.19, playerShotSpeed: 0.9, enemyHitsToKill: 3, enemyCount: 1.4, enemySpeed: 1.3, enemyFireRate: 1.4, enemyShotSpeed: 1.28 },
  overdrive: { label: 'Sobremarcha', rank: 5, speed: 1.8, startingLives: 1, lifeCap: 1, startingBombs: 1, bombCap: 1,
    playerShotInterval: 0.22, playerShotSpeed: 0.85, enemyHitsToKill: 4, enemyCount: 1.6, enemySpeed: 1.45, enemyFireRate: 1.6, enemyShotSpeed: 1.42 },
} as const satisfies Record<string, DifficultyProfile>;

export type Difficulty = keyof typeof DIFFICULTIES;

export function difficulty(value: unknown): Difficulty {
  return typeof value === 'string' && Object.hasOwn(DIFFICULTIES, value) ? value as Difficulty : 'normal';
}

export function difficultyProfile(value: unknown): (typeof DIFFICULTIES)[Difficulty] {
  return DIFFICULTIES[difficulty(value)];
}
