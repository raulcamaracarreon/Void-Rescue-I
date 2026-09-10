import { radarSegments, wrapX } from '../core/WorldWrap';
import { CONFIG, SETTLEMENTS } from '../game/config';
import type { FlightState } from '../game/Simulation';
import { Terrain } from '../game/Terrain';

export class Radar {
  private readonly context: CanvasRenderingContext2D;
  private terrain = new Terrain(CONFIG.defaultSeed);
  private seed = Number(CONFIG.defaultSeed);

  constructor(private readonly canvas: HTMLCanvasElement) {
    const context = canvas.getContext('2d');
    if (!context) throw new Error('No se pudo inicializar el radar.');
    this.context = context;
  }

  draw(state: FlightState, cameraX: number, viewWidth: number): void {
    if (state.seed !== this.seed) { this.seed = state.seed; this.terrain = new Terrain(state.seed); }
    const rect = this.canvas.getBoundingClientRect();
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const width = Math.max(1, Math.round(rect.width * dpr)), height = Math.max(1, Math.round(rect.height * dpr));
    if (this.canvas.width !== width || this.canvas.height !== height) { this.canvas.width = width; this.canvas.height = height; }
    const c = this.context;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    const w = width / dpr, h = height / dpr;
    c.clearRect(0, 0, w, h);
    c.strokeStyle = '#7caaa91c'; c.lineWidth = 1;
    for (let i = 0; i <= 12; i++) { const x = i * w / 12; c.beginPath(); c.moveTo(x, 0); c.lineTo(x, h); c.stroke(); }
    c.fillStyle = '#79dcca12';
    c.strokeStyle = '#79dcca60';
    for (const [start, end] of radarSegments(cameraX, viewWidth, CONFIG.worldWidth)) {
      c.fillRect(start * w, 1, (end - start) * w, h - 2);
      c.strokeRect(start * w, 1, (end - start) * w, h - 2);
    }
    c.beginPath(); c.moveTo(0, h);
    for (let x = 0; x <= w; x += 2) c.lineTo(x, h - this.terrain.height(x / w * CONFIG.worldWidth) * h / 105);
    c.lineTo(w, h); c.closePath(); c.fillStyle = '#375558'; c.fill();
    for (const station of SETTLEMENTS) {
      const x = station.x / CONFIG.worldWidth * w, y = h - 8;
      c.strokeStyle = '#cbb88c'; c.beginPath(); c.moveTo(x, y - 4); c.lineTo(x + 3, y); c.lineTo(x, y + 4); c.lineTo(x - 3, y); c.closePath(); c.stroke();
    }
    const mark = (x: number, y: number, type: 'colonist' | 'enemy' | 'portal' | 'falling' | 'captured' | 'targeted', tint: string) => {
      const px = wrapX(x, CONFIG.worldWidth) / CONFIG.worldWidth * w, py = h - y / 105 * h;
      c.strokeStyle = c.fillStyle = tint;
      for (const rx of [px, px - w, px + w]) {
        if (type === 'falling' || type === 'captured' || type === 'targeted') {
          c.font = 'bold 13px monospace'; c.textAlign = 'center'; c.textBaseline = 'middle';
          c.fillText(type === 'falling' ? '↓' : type === 'captured' ? '↑' : '!', rx, py);
        } else if (type === 'colonist') { c.fillRect(rx - 1.5, py - 2.5, 3, 5); }
        else if (type === 'portal') { c.beginPath(); c.arc(rx, py, 4, 0, Math.PI * 2); c.stroke(); }
        else { c.beginPath(); c.moveTo(rx, py - 3); c.lineTo(rx + 3, py + 2); c.lineTo(rx - 3, py + 2); c.closePath(); c.fill(); }
      }
    };
    for (const colonist of state.colonists) if (colonist.status !== 'lost') mark(colonist.x, colonist.y,
      colonist.status === 'falling' || colonist.status === 'captured' || colonist.status === 'targeted' ? colonist.status : 'colonist',
      ['captured', 'targeted', 'falling'].includes(colonist.status) ? '#ffca80' : '#baffdf');
    for (const enemy of state.enemies) mark(enemy.x, enemy.y, 'enemy', enemy.kind === 'wraith' ? '#ed91ff' : '#ff837b');
    if (state.portal.ready) mark(state.portal.x, state.portal.y, 'portal', '#b894ff');
    const px = wrapX(state.player.x, CONFIG.worldWidth) / CONFIG.worldWidth * w;
    const py = h - state.player.y / 105 * h;
    c.fillStyle = '#bcfff0';
    for (const x of [px, px - w, px + w]) {
      c.beginPath(); c.moveTo(x + state.player.facing * 5, py); c.lineTo(x - state.player.facing * 3, py - 3); c.lineTo(x - state.player.facing * 3, py + 3); c.closePath(); c.fill();
    }
  }
}
