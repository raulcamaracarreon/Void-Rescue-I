export const CONFIG = {
  worldWidth: 2400,
  viewHeight: 112,
  minAltitude: 26,
  maxAltitude: 82,
  startX: 360,
  startY: 54,
  acceleration: 95,
  drag: 1.25,
  maxSpeed: 70,
  verticalSpeed: 40,
  verticalResponse: 14,
  shotSpeed: 180,
  shotInterval: 0.15,
  shotLifetime: 1.15,
  defaultSeed: 8042,
} as const;

export const SETTLEMENTS = [
  { x: 330, name: 'ESTACIÓN 01', short: '01' },
  { x: 1160, name: 'ESTACIÓN 02', short: '02' },
  { x: 2040, name: 'ESTACIÓN 03', short: '03' },
] as const;

export const SAFE_BASE = { x: SETTLEMENTS[0].x, radius: 22, name: 'FORTALEZA 01' } as const;
