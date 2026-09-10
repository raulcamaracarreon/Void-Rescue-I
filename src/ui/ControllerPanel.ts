import { Controller, PAD_ACTIONS, PAD_NAMES } from '../input/Controller';

export class ControllerPanel {
  readonly dialog: HTMLDialogElement;
  private readonly devices: HTMLSelectElement;
  private deviceKey = '';
  constructor(root: HTMLElement, private readonly controller: Controller, private readonly onClose: () => void) {
    this.dialog = document.createElement('dialog');
    this.dialog.className = 'controller-dialog pause-dialog'; this.dialog.setAttribute('aria-labelledby', 'controller-title');
    this.dialog.innerHTML = `<p class="eyebrow">SISTEMAS / ENTRADA USB</p><h2 id="controller-title">Configurar mando</h2>
      <p class="controller-help">Pulsa un botón de tu mando para detectarlo. Prueba aquí el stick y los botones.</p>
      <label class="setting">Dispositivo <select id="controller-device" aria-label="Dispositivo de mando"></select></label>
      <p id="controller-info" role="status"></p><div id="controller-live" class="controller-live"></div><p id="controller-activity"></p>
      <p id="controller-instruction" class="controller-instruction" aria-live="polite"></p>
      <p class="controller-help">Para calibrar, deja el stick y la cruceta sueltos. Después sigue las nueve indicaciones: mueve una dirección o pulsa el botón que quieras asignar y suéltalo.</p>
      <button id="controller-calibrate" class="primary">CALIBRAR DIRECCIONES Y BOTONES</button>
      <div class="controller-actions"><button id="controller-cancel">Cancelar calibración</button><button id="controller-reset">Restablecer</button><button id="controller-close">LISTO / VOLVER</button></div>`;
    root.append(this.dialog);
    this.devices = this.dialog.querySelector('select')!;
    this.devices.addEventListener('change', () => controller.select(this.devices.value));
    this.dialog.querySelector('#controller-calibrate')!.addEventListener('click', () => controller.calibrate());
    this.dialog.querySelector('#controller-cancel')!.addEventListener('click', () => controller.cancelCalibration());
    this.dialog.querySelector('#controller-reset')!.addEventListener('click', () => controller.reset());
    this.dialog.querySelector('#controller-close')!.addEventListener('click', () => this.close());
    this.dialog.addEventListener('cancel', event => { event.preventDefault(); this.close(); });
  }
  get open(): boolean { return this.dialog.open; }
  show(): void { this.dialog.showModal(); this.update(); }
  close(): void { this.controller.cancelCalibration(); this.dialog.close(); this.onClose(); }
  update(): void {
    const c = this.controller;
    const status = c.error || (c.active ? `${c.active.id} · ${c.calibrated ? 'PERFIL GUARDADO' : c.active.mapping === 'standard' ? 'LISTO' : 'USB DETECTADO · Calibra si hace falta'}`
      : 'Pulsa un botón del mando USB para detectarlo');
    document.querySelectorAll('.controller-status').forEach(e => { if (e.textContent !== status) e.textContent = status; });
    if (!this.open) return;
    const key = c.pads.map(p => `${p.index}:${p.id}`).join('|');
    if (key !== this.deviceKey) {
      this.deviceKey = key; this.devices.replaceChildren();
      for (const p of c.pads) { const option = document.createElement('option'); option.value = p.id; option.textContent = p.id; this.devices.append(option); }
    }
    this.devices.value = c.active?.id ?? '';
    this.dialog.querySelector('#controller-info')!.textContent = status;
    this.dialog.querySelector('#controller-activity')!.textContent = c.lastActivity;
    const live = this.dialog.querySelector('#controller-live')!;
    // Only numeric device samples enter markup; device identifiers use textContent.
    live.innerHTML = c.active ? `<div class="axis-readings">${c.active.axes.map((v, i) => `<span>Eje ${i + 1} <b>${v.toFixed(2)}</b><meter min="-1" max="1" value="${Math.max(-1, Math.min(1, v))}"></meter></span>`).join('')}</div><div class="button-readings">${c.active.buttons.map((b, i) => `<span class="${b.pressed ? 'pressed' : ''}">${i + 1}${b.pressed ? ' ●' : ''}</span>`).join('')}</div>` : 'Sin señal del navegador. Haz clic en el juego y pulsa un botón del mando. Si sigue vacío, abre esta dirección directamente en Chrome o Edge.';
    const step = c.calibrationStep;
    this.dialog.querySelector('#controller-instruction')!.textContent = step >= 0
      ? c.waitingNeutral ? 'SUELTA LOS CONTROLES…' : `${step + 1} / 9 · ${PAD_NAMES[PAD_ACTIONS[step]!]}`
      : c.calibrated ? '✓ Perfil guardado. Prueba los controles y pulsa LISTO.' : 'Usa el perfil inicial o calibra tu distribución de botones.';
    (this.dialog.querySelector('#controller-calibrate') as HTMLButtonElement).disabled = !c.active || step >= 0;
    (this.dialog.querySelector('#controller-reset') as HTMLButtonElement).disabled = !c.active;
    (this.dialog.querySelector('#controller-cancel') as HTMLElement).hidden = step < 0;
  }
  navigate(command: { x: number; y: number; confirm: boolean; back: boolean }): void {
    if (this.controller.calibrationStep >= 0) return;
    if (command.back) { this.close(); return; }
    const controls = [...this.dialog.querySelectorAll<HTMLButtonElement | HTMLSelectElement>('button,select')].filter(e => !e.disabled && e.getBoundingClientRect().width > 0);
    let index = Math.max(0, controls.indexOf(document.activeElement as HTMLButtonElement));
    let selected = controls[index]; if (!selected) return;
    if (command.x && selected instanceof HTMLSelectElement) {
      selected.selectedIndex = Math.max(0, Math.min(selected.options.length - 1, selected.selectedIndex + command.x));
      selected.dispatchEvent(new Event('change'));
    } else if (command.x || command.y) { index = (index + (command.y || command.x) + controls.length) % controls.length; selected = controls[index]!; }
    if (command.x || command.y || command.confirm) { selected.focus(); if (command.confirm) selected.click(); }
  }
}
