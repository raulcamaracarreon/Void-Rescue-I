export const BINDINGS = {
  left: ['KeyA', 'ArrowLeft'], right: ['KeyD', 'ArrowRight'],
  up: ['KeyW', 'ArrowUp'], down: ['KeyS', 'ArrowDown'],
  fire: ['Space'], pause: ['Escape'], mute: ['KeyM'],
  restart: ['KeyR'], diagnostics: ['F3'],
} as const;
export type Action = keyof typeof BINDINGS;
export const GAMEPAD = { fire: 0, pause: 9, up: 12, down: 13, left: 14, right: 15, deadZone: 0.18 } as const;

export const CONTROL_LABELS = [
  ['WASD / ↑↓←→', 'Pilotar'], ['ESPACIO', 'Disparo de prueba'],
  ['ESC', 'Pausa'], ['M', 'Silencio'], ['R', 'Reiniciar'],
] as const;
