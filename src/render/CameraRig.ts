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

  update(playerX: number, velocity: number, facing: number, viewWidth: number, dt: number, reducedMotion: boolean): void {
    this.playerContinuousX = nearCameraX(playerX, this.playerContinuousX, CONFIG.worldWidth);
    // The ship occupies the first or third quarter of the view, matching the
    // original combat framing.  Velocity only adds a very small lead so it
    // never displaces that intentional composition.
    const lookAhead = facing * viewWidth * 0.25 + (reducedMotion ? 0 : velocity * 0.035);
    const target = this.playerContinuousX + lookAhead;
    this.x += (target - this.x) * (1 - Math.exp(-(reducedMotion ? 6 : 14) * Math.min(dt, 0.1)));
  }
}
