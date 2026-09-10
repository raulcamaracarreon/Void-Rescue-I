import type { FlightInput } from '../game/Simulation';
import { BINDINGS, GAMEPAD } from './bindings';
import type { Action } from './bindings';

export interface GamepadSnapshot {
  axes: readonly number[];
  buttons: readonly { pressed: boolean }[];
}

export function analogAxis(value: number): number {
  const clamped = Math.max(-1, Math.min(1, value));
  return Math.abs(clamped) < GAMEPAD.deadZone ? 0
    : Math.sign(clamped) * (Math.abs(clamped) - GAMEPAD.deadZone) / (1 - GAMEPAD.deadZone);
}

export function readGamepad(pad: GamepadSnapshot | null): FlightInput & { pause: boolean } {
  const pressed = (id: number) => pad?.buttons[id]?.pressed ?? false;
  const dpadX = Number(pressed(GAMEPAD.right)) - Number(pressed(GAMEPAD.left));
  const dpadY = Number(pressed(GAMEPAD.up)) - Number(pressed(GAMEPAD.down));
  return {
    x: dpadX || analogAxis(pad?.axes[0] ?? 0),
    y: dpadY || -analogAxis(pad?.axes[1] ?? 0),
    fire: pressed(GAMEPAD.fire), pause: pressed(GAMEPAD.pause),
  };
}

export class InputManager {
  private readonly keys = new Set<string>();
  private readonly pressed = new Set<Action>();
  private previousPadPause = false;
  private padFlight = readGamepad(null);
  gamepadConnected = false;

  constructor() {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.clear);
  }

  private onKeyDown = (event: KeyboardEvent): void => {
    // Let focused menu controls retain native keyboard operation.
    const target = event.target as HTMLElement | null;
    if (target?.matches('input, select, textarea, button') && event.code !== 'Escape') return;
    for (const [name, codes] of Object.entries(BINDINGS)) {
      if ((codes as readonly string[]).includes(event.code)) {
        event.preventDefault();
        if (!event.repeat) this.pressed.add(name as Action);
        this.keys.add(event.code);
      }
    }
  };

  private onKeyUp = (event: KeyboardEvent): void => { this.keys.delete(event.code); };

  poll(): void {
    const pad = Array.from(navigator.getGamepads?.() ?? []).find(p => p?.connected && p.mapping === 'standard') ?? null;
    this.gamepadConnected = pad !== null;
    this.padFlight = readGamepad(pad);
    if (this.padFlight.pause && !this.previousPadPause) this.pressed.add('pause');
    this.previousPadPause = this.padFlight.pause;
  }

  consume(action: Action): boolean {
    const value = this.pressed.has(action);
    this.pressed.delete(action);
    return value;
  }

  flight(): FlightInput {
    const held = (action: Action) => BINDINGS[action].some(code => this.keys.has(code));
    const keyboardX = Number(held('right')) - Number(held('left'));
    const keyboardY = Number(held('up')) - Number(held('down'));
    return { x: keyboardX || this.padFlight.x, y: keyboardY || this.padFlight.y, fire: held('fire') || this.padFlight.fire };
  }

  clear = (): void => {
    this.keys.clear();
    this.pressed.clear();
    this.padFlight = readGamepad(null);
  };

  dispose(): void {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('blur', this.clear);
  }
}
