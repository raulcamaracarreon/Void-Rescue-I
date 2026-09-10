import { Random } from '../core/Random';
import { CONFIG } from './config';

/** Integer-frequency harmonics make height and slope periodic at the seam. */
export class Terrain {
  private readonly phases: number[];
  constructor(seed: number) {
    const random = new Random(seed);
    this.phases = Array.from({ length: 4 }, () => random.range(0, Math.PI * 2));
  }

  height(x: number): number {
    const t = x / CONFIG.worldWidth * Math.PI * 2;
    return 10 + Math.sin(t * 7 + this.phases[0]!) * 2.4
      + Math.sin(t * 19 + this.phases[1]!) * 1.3
      + Math.sin(t * 43 + this.phases[2]!) * 0.55
      + Math.sin(t * 89 + this.phases[3]!) * 0.2;
  }
}
