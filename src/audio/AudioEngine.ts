export class AudioEngine {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private engineGain: GainNode | null = null;
  private engine: OscillatorNode | null = null;
  muted = false;
  volume = 0.45;

  async unlock(): Promise<void> {
    if (!this.context) {
      const context = this.context = new AudioContext();
      const master = this.master = context.createGain();
      const compressor = context.createDynamicsCompressor();
      compressor.threshold.value = -16;
      compressor.ratio.value = 8;
      master.connect(compressor).connect(context.destination);
      const engine = this.engine = context.createOscillator();
      engine.type = 'sawtooth';
      const filter = context.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 160;
      const gain = this.engineGain = context.createGain();
      gain.gain.value = 0;
      engine.connect(filter).connect(gain).connect(master);
      engine.start();
    }
    await this.context.resume();
    this.setVolume(this.volume);
  }

  setVolume(value: number): void {
    this.volume = Math.max(0, Math.min(1, value));
    if (this.context && this.master) this.master.gain.setTargetAtTime(this.muted ? 0 : this.volume, this.context.currentTime, 0.025);
  }

  setMuted(value: boolean): void { this.muted = value; this.setVolume(this.volume); }

  update(thrust: number, speed: number, active: boolean): void {
    if (!this.context || !this.engine || !this.engineGain) return;
    const now = this.context.currentTime;
    this.engine.frequency.setTargetAtTime(36 + speed * 0.8 + thrust * 15, now, 0.06);
    this.engineGain.gain.setTargetAtTime(active ? 0.022 + thrust * 0.06 : 0, now, 0.06);
  }

  pulse(): void {
    if (!this.context || !this.master || this.muted) return;
    const now = this.context.currentTime;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(740, now);
    oscillator.frequency.exponentialRampToValueAtTime(95, now + 0.11);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    oscillator.connect(gain).connect(this.master);
    oscillator.start(now);
    oscillator.stop(now + 0.13);
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
  }

  getState(): { initialized: boolean; state: string; muted: boolean; volume: number } {
    return { initialized: this.context !== null, state: this.context?.state ?? 'locked', muted: this.muted, volume: this.volume };
  }

  dispose(): void { this.engine?.stop(); void this.context?.close(); }
}
