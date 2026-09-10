export const BINDINGS = {
  left: ['KeyA', 'ArrowLeft'], right: ['KeyD', 'ArrowRight'],
  up: ['KeyW', 'ArrowUp'], down: ['KeyS', 'ArrowDown'],
  fire: ['Space'], pause: ['Escape'], mute: ['KeyM'],
  restart: ['KeyR'], diagnostics: ['F3'],
  bomb: ['ShiftLeft', 'ShiftRight'], portal: ['KeyE'], confirm: ['Enter'], back: ['Backspace'],
} as const;
export type Action = keyof typeof BINDINGS;
export const GAMEPAD = { fire: 0, back: 1, bomb: 2, portal: 3, pause: 9, up: 12, down: 13, left: 14, right: 15, deadZone: 0.18 } as const;

export const CONTROL_LABELS = [
  ['WASD / ↑↓←→', 'Pilotar'], ['ESPACIO', 'Disparar'], ['SHIFT', 'Bomba'], ['E', 'Portal'],
  ['ESC', 'Pausa'], ['M', 'Silencio'],
] as const;
export const PAD_CONTROL_LABELS = [
  ['STICK / +', 'Pilotar'], ['SUR · A/×', 'Disparar'], ['OESTE · X/□', 'Bomba'],
  ['NORTE · Y/△', 'Portal'], ['START', 'Pausa'],
] as const;
