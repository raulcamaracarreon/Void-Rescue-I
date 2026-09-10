export const DIFFICULTIES = { relaxed: { label: 'Relajado', speed: 0.8 }, normal: { label: 'Normal', speed: 1 },
  hard: { label: 'Difícil', speed: 1.25 }, expert: { label: 'Experto', speed: 1.5 } } as const;
export type Difficulty = keyof typeof DIFFICULTIES;
export function difficulty(value: unknown): Difficulty { return typeof value === 'string' && Object.hasOwn(DIFFICULTIES, value) ? value as Difficulty : 'normal'; }
