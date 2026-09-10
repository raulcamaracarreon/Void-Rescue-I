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
    const px = wrapX(state.player.x, CONFIG.worldWidth) / CONFIG.worldWidth * w;
    const py = h - state.player.y / 105 * h;
    c.fillStyle = '#bcfff0';
    for (const x of [px, px - w, px + w]) {
      c.beginPath(); c.moveTo(x + state.player.facing * 5, py); c.lineTo(x - state.player.facing * 3, py - 3); c.lineTo(x - state.player.facing * 3, py + 3); c.closePath(); c.fill();
    }
  }
}
