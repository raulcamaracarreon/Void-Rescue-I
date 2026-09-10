import { nearCameraX } from '../core/WorldWrap';
import { CONFIG } from '../game/config';

export class CameraRig {
  x: number;
  private playerContinuousX: number;
  constructor(playerX: number) { this.x = playerX; this.playerContinuousX = playerX; }

  reset(playerX: number, title = false): void {
    this.playerContinuousX = playerX;
    this.x = playerX - (title ? 42 : 0);
  }

  update(playerX: number, velocity: number, facing: number, dt: number, reducedMotion: boolean): void {
    this.playerContinuousX = nearCameraX(playerX, this.playerContinuousX, CONFIG.worldWidth);
    const lookAhead = reducedMotion ? 0 : facing * 9 + velocity * 0.17;
    const target = this.playerContinuousX + lookAhead;
    this.x += (target - this.x) * (1 - Math.exp(-5.5 * Math.min(dt, 0.1)));
  }
}
