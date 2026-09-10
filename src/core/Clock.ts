export class FixedClock {
  readonly dt = 1 / 60;
  private accumulator = 0;
  droppedSeconds = 0;

  advance(elapsed: number, update: (dt: number) => void): number {
    const clamped = Math.max(0, Math.min(elapsed, 0.1));
    this.droppedSeconds += Math.max(0, elapsed - clamped);
    this.accumulator += clamped;
    while (this.accumulator + 1e-10 >= this.dt) {
      update(this.dt);
      this.accumulator -= this.dt;
    }
    this.accumulator = Math.max(0, this.accumulator);
    return this.accumulator / this.dt;
  }

  reset(): void { this.accumulator = 0; }
}
