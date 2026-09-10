import { GAMEPAD } from './bindings';

export const PAD_ACTIONS = ['left', 'right', 'up', 'down', 'fire', 'bomb', 'portal', 'pause', 'back'] as const;
export type PadAction = typeof PAD_ACTIONS[number];
export type PadBinding = { kind: 'button'; index: number } | { kind: 'axis'; index: number; sign: number }
  | { kind: 'hat'; index: number; sector: number };
export type PadProfile = Record<PadAction, PadBinding>;
export interface RawPad { axes: readonly number[]; buttons: readonly { pressed: boolean; value?: number }[] }
export const PAD_NAMES: Record<PadAction, string> = { left: 'IZQUIERDA', right: 'DERECHA', up: 'ARRIBA', down: 'ABAJO',
  fire: 'DISPARAR / CONFIRMAR', bomb: 'BOMBA', portal: 'PORTAL', pause: 'PAUSA / INICIAR', back: 'VOLVER' };

export function axis(value: number): number {
  if (!Number.isFinite(value) || Math.abs(value) > 1.01) return 0;
  return Math.abs(value) < GAMEPAD.deadZone ? 0 : Math.sign(value) * (Math.min(1, Math.abs(value)) - GAMEPAD.deadZone) / (1 - GAMEPAD.deadZone);
}
export function defaultProfile(): PadProfile {
  return { left: { kind: 'axis', index: 0, sign: -1 }, right: { kind: 'axis', index: 0, sign: 1 },
    up: { kind: 'axis', index: 1, sign: -1 }, down: { kind: 'axis', index: 1, sign: 1 },
    fire: { kind: 'button', index: 0 }, bomb: { kind: 'button', index: 2 }, portal: { kind: 'button', index: 3 },
    pause: { kind: 'button', index: 9 }, back: { kind: 'button', index: 1 } };
}
export function bindingValue(pad: RawPad | null, binding: PadBinding): number {
  if (!pad) return 0;
  if (binding.kind === 'button') return Number(pad.buttons[binding.index]?.pressed || (pad.buttons[binding.index]?.value ?? 0) > 0.5);
  const value = pad.axes[binding.index] ?? 0;
  if (binding.kind === 'axis') return Math.max(0, axis(value) * binding.sign);
  if (Math.abs(value) > 1.01) return 0;
  const sector = Math.round((value + 1) * 3.5);
  const difference = Math.abs(sector - binding.sector);
  return Number(Math.min(difference, 8 - difference) <= 1);
}
export function readController(pad: RawPad | null, profile: PadProfile = defaultProfile(), standard = true) {
  const b = (action: PadAction) => bindingValue(pad, profile[action]);
  const dpadX = standard ? Number(pad?.buttons[15]?.pressed ?? false) - Number(pad?.buttons[14]?.pressed ?? false) : 0;
  const dpadY = standard ? Number(pad?.buttons[12]?.pressed ?? false) - Number(pad?.buttons[13]?.pressed ?? false) : 0;
  return { x: dpadX || b('right') - b('left'), y: dpadY || b('up') - b('down'),
    fire: b('fire') > 0.5, bomb: b('bomb') > 0.5, portal: b('portal') > 0.5, pause: b('pause') > 0.5, back: b('back') > 0.5 };
}
function validProfile(value: unknown): value is PadProfile {
  if (!value || typeof value !== 'object') return false;
  return PAD_ACTIONS.every(action => {
    const b = (value as PadProfile)[action];
    return b && Number.isInteger(b.index) && b.index >= 0 && b.index < 64 && (b.kind === 'button'
      || b.kind === 'axis' && (b.sign === 1 || b.sign === -1) || b.kind === 'hat' && Number.isInteger(b.sector) && b.sector >= 0 && b.sector < 8);
  });
}

export class Controller {
  pads: Gamepad[] = [];
  active: Gamepad | null = null;
  error = '';
  profile = defaultProfile();
  calibrated = false;
  calibrationStep = -1;
  waitingNeutral = false;
  private selectedId = '';
  private profileId = '';
  private baseline: number[] = [];
  private draft = defaultProfile();
  private profiles: Record<string, PadProfile> = {};
  private readyAt = 0;
  private finishRelease = false;
  private hatIndex = -1;
  private previousButtons: boolean[] = [];
  private previousAxes: number[] = [];
  lastActivity = 'Esperando que muevas o pulses un control';

  constructor() {
    try {
      const saved: unknown = JSON.parse(localStorage.getItem('void-rescue.controllers') ?? '{}');
      if (saved && typeof saved === 'object') for (const [id, p] of Object.entries(saved)) if (validProfile(p)) this.profiles[id] = p;
    } catch { /* Invalid or unavailable storage uses defaults. */ }
  }
  poll(): ReturnType<typeof readController> {
    try {
      this.error = typeof navigator.getGamepads === 'function' ? '' : 'Este navegador no ofrece acceso al mando. Abre el juego en Chrome o Edge.';
      this.pads = Array.from(navigator.getGamepads?.() ?? []).filter((p): p is Gamepad => Boolean(p?.connected));
    } catch { this.pads = []; this.error = 'El navegador bloquea el acceso al mando. Abre esta dirección directamente en Chrome o Edge.'; }
    this.active = this.pads.find(p => p.id === this.selectedId) ?? this.pads[0] ?? null;
    if (!this.active) { this.cancelCalibration(); this.profileId = ''; return readController(null); }
    if (this.profileId !== this.active.id) {
      this.cancelCalibration(); this.profileId = this.active.id;
      this.calibrated = Boolean(this.profiles[this.profileId]);
      this.profile = structuredClone(this.profiles[this.profileId] ?? defaultProfile());
      this.hatIndex = this.active.mapping === 'standard' ? -1 : this.active.axes.findIndex(v => Math.abs(v) > 1.01);
      this.previousAxes = [...this.active.axes]; this.previousButtons = this.active.buttons.map(b => b.pressed);
    }
    const pressedButton = this.active.buttons.findIndex((b, i) => b.pressed && !this.previousButtons[i]);
    const movedAxis = this.active.axes.findIndex((v, i) => Math.abs(v - (this.previousAxes[i] ?? 0)) > 0.3 && Math.abs(v) <= 1.01);
    if (pressedButton >= 0) this.lastActivity = `Botón ${pressedButton + 1} recibido`;
    else if (movedAxis >= 0) this.lastActivity = `Eje ${movedAxis + 1}: ${this.active.axes[movedAxis]!.toFixed(2)} recibido`;
    this.previousButtons = this.active.buttons.map(b => b.pressed); this.previousAxes = [...this.active.axes];
    if (this.finishRelease) {
      if (!this.active.buttons.some(b => b.pressed) && this.active.axes.every((v, i) => Math.abs(v - (this.baseline[i] ?? 0)) < 0.22)) this.finishRelease = false;
      return readController(null);
    }
    if (this.calibrationStep >= 0) { this.capture(); return readController(null); }
    const result = readController(this.active, this.profile, this.active.mapping === 'standard' && !this.calibrated);
    if (!this.calibrated && this.hatIndex >= 0) {
      const hat = (sector: number) => bindingValue(this.active, { kind: 'hat', index: this.hatIndex, sector });
      result.x = hat(2) - hat(6) || result.x; result.y = hat(0) - hat(4) || result.y;
    }
    return result;
  }
  select(id: string): void { this.selectedId = id; this.profileId = ''; }
  calibrate(): void {
    if (!this.active) return;
    this.baseline = [...this.active.axes]; this.draft = defaultProfile(); this.calibrationStep = 0;
    this.waitingNeutral = true; this.readyAt = performance.now() + 250;
  }
  cancelCalibration(): void { this.calibrationStep = -1; this.waitingNeutral = false; this.finishRelease = false; }
  reset(): void {
    if (!this.active) return;
    delete this.profiles[this.active.id]; this.profileId = ''; this.cancelCalibration(); this.save();
  }
  private save(): void { try { localStorage.setItem('void-rescue.controllers', JSON.stringify(this.profiles)); } catch { /* Session profile remains active. */ } }
  private capture(): void {
    const pad = this.active!;
    const neutral = !pad.buttons.some(b => b.pressed || b.value > 0.5) && pad.axes.every((v, i) => Math.abs(v - (this.baseline[i] ?? 0)) < 0.22);
    if (this.waitingNeutral) { if (neutral && performance.now() >= this.readyAt) this.waitingNeutral = false; return; }
    let binding: PadBinding | undefined;
    const button = pad.buttons.findIndex(b => b.pressed || b.value > 0.5);
    if (button >= 0) binding = { kind: 'button', index: button };
    else if (this.calibrationStep < 4) {
      const index = pad.axes.findIndex((v, i) => Math.abs(v - (this.baseline[i] ?? 0)) > 0.65);
      if (index >= 0) binding = Math.abs(this.baseline[index] ?? 0) > 1.01
        ? { kind: 'hat', index, sector: Math.round((pad.axes[index]! + 1) * 3.5) }
        : { kind: 'axis', index, sign: Math.sign(pad.axes[index]!) };
    }
    if (!binding) return;
    this.draft[PAD_ACTIONS[this.calibrationStep]!] = binding;
    this.calibrationStep++;
    if (this.calibrationStep === PAD_ACTIONS.length) {
      this.profile = this.draft; this.profiles[pad.id] = this.draft; this.calibrated = true;
      this.save(); this.cancelCalibration(); this.finishRelease = true;
    } else { this.waitingNeutral = true; this.readyAt = performance.now() + 200; }
  }
  snapshot() {
    return { available: !this.error, error: this.error, id: this.active?.id ?? null, mapping: this.active?.mapping ?? null,
      calibrated: this.calibrated, calibrationStep: this.calibrationStep, lastActivity: this.lastActivity,
      axes: this.active ? [...this.active.axes] : [], buttons: this.active?.buttons.map(b => b.pressed) ?? [], profile: structuredClone(this.profile) };
  }
  labels(): [string, string][] | undefined {
    if (!this.active || this.active.mapping === 'standard' && !this.calibrated) return undefined;
    const name = (action: PadAction) => `${this.profile[action].kind === 'button' ? 'BOTÓN' : 'EJE'} ${this.profile[action].index + 1}`;
    return [['STICK / +', 'Pilotar'], [name('fire'), 'Disparar'], [name('bomb'), 'Bomba'],
      [name('portal'), 'Portal'], [name('pause'), 'Pausa'], [name('back'), 'Volver']];
  }
}
