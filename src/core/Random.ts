/** Mulberry32: stable unsigned 32-bit state; no rendering code consumes this RNG. */
export class Random {
  private value: number;

  constructor(seed: number) { this.value = seed >>> 0; }

  next(): number {
    this.value = (this.value + 0x6d2b79f5) >>> 0;
    let t = this.value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  range(min: number, max: number): number { return min + (max - min) * this.next(); }
}
