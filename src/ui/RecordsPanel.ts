import { DIFFICULTIES } from '../game/Difficulty';
import type { Records } from '../game/Records';

export class RecordsPanel {
  private readonly dialog: HTMLDialogElement;
  constructor(root: HTMLElement, private readonly records: Records, onClose: () => void) {
    this.dialog = document.createElement('dialog');
    this.dialog.className = 'pause-dialog records-dialog';
    this.dialog.setAttribute('aria-labelledby', 'records-title');
    this.dialog.innerHTML = `<p class="eyebrow">ARCHIVO DE VUELO / TOP 10 LOCAL</p><h2 id="records-title">Récords de pilotos<span>.</span></h2>
      <p class="pause-note">Puntos acumulados · oleada alcanzada · dificultad mínima usada en la partida.</p>
      <div class="records-table"><table><thead><tr><th>#</th><th>Piloto</th><th>Puntos</th><th>Oleada</th><th>Dificultad</th></tr></thead><tbody></tbody></table></div>
      <p class="records-empty">Aún no hay récords. ¡Inicia un vuelo!</p><p class="records-storage"></p>
      <button class="primary">VOLVER <span>↗</span></button><p class="pad-help">Confirmar / volver: cerrar</p>`;
    root.append(this.dialog);
    this.dialog.querySelector('button')!.addEventListener('click', () => this.close());
    this.dialog.addEventListener('cancel', event => { event.preventDefault(); this.close(); });
    this.dialog.addEventListener('close', onClose);
  }
  get open(): boolean { return this.dialog.open; }
  show(): void {
    const entries = this.records.list();
    const body = this.dialog.querySelector('tbody')!; body.replaceChildren();
    for (const [index, r] of entries.entries()) {
      const row = document.createElement('tr'); row.title = new Date(r.date).toLocaleString();
      for (const value of [index + 1, r.pilot, r.score.toLocaleString(), r.wave, DIFFICULTIES[r.difficulty].label]) {
        const cell = document.createElement('td'); cell.textContent = String(value); row.append(cell);
      }
      body.append(row);
    }
    this.dialog.querySelector<HTMLElement>('.records-empty')!.hidden = entries.length > 0;
    this.dialog.querySelector('.records-storage')!.textContent = this.records.persistent
      ? 'Guardado automático al completar oleada, terminar o salir. Solo en este navegador; no reanuda la partida.'
      : 'Almacenamiento no disponible: los récords solo durarán esta sesión.';
    this.dialog.showModal();
  }
  close(): void { this.dialog.close(); }
  navigate(input: { confirm: boolean; back: boolean }): void { if (input.confirm || input.back) this.close(); }
}
