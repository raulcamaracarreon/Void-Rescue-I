export const MISSION_MODES = {
  defense: { label: 'Defensivo', short: 'Defensa' },
  rescue: { label: 'Rescatista', short: 'Rescate' },
} as const;

export type MissionMode = keyof typeof MISSION_MODES;

export function missionMode(value: unknown): MissionMode {
  return typeof value === 'string' && Object.hasOwn(MISSION_MODES, value) ? value as MissionMode : 'defense';
}
