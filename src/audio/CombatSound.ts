export type CombatSoundKind = 'shot' | 'impact' | 'explosion' | 'player-hit' | 'bomb';

export function masterBus(context: BaseAudioContext, destination: AudioNode): GainNode {
  const input = context.createGain(), compressor = context.createDynamicsCompressor(), ceiling = context.createWaveShaper();
  compressor.threshold.value = -18; compressor.knee.value = 12; compressor.ratio.value = 12;
  compressor.attack.value = 0.003; compressor.release.value = 0.2;
  const curve = new Float32Array(4097);
  for (let i = 0; i < curve.length; i++) curve[i] = 0.9 * Math.tanh((i / (curve.length - 1) * 2 - 1) / 0.9);
  ceiling.curve = curve; ceiling.oversample = '2x';
  input.connect(compressor).connect(ceiling).connect(destination); return input;
}

/** Procedural impact layers shared by realtime playback and offline verification. */
export class CombatSound {
  private readonly noise: AudioBuffer;
  constructor(private readonly context: BaseAudioContext, private readonly destination: AudioNode) {
    this.noise = context.createBuffer(1, context.sampleRate * 2, context.sampleRate);
    const samples = this.noise.getChannelData(0); let seed = 70129;
    for (let i = 0; i < samples.length; i++) { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; samples[i] = seed / 0xffffffff * 2 - 1; }
  }
  play(kind: CombatSoundKind, panValue = 0, seed = 0, done: () => void = () => {}, at = this.context.currentTime): void {
    const c = this.context, output = c.createGain(), pan = c.createStereoPanner();
    pan.pan.value = Math.max(-0.85, Math.min(0.85, panValue)); output.connect(pan).connect(this.destination);
    const large = kind === 'bomb' || kind === 'player-hit';
    const strength = kind === 'shot' ? 0.45 : kind === 'impact' ? 0.55 : large ? 1 : 0.85;
    output.gain.value = strength;
    const cleanup: AudioNode[] = [output, pan];
    const tone = (frequency: number, end: number, duration: number, gainValue: number, type: OscillatorType, delay = 0) => {
      const osc = c.createOscillator(), gain = c.createGain(), start = at + delay;
      osc.type = type; osc.frequency.setValueAtTime(frequency, start); osc.frequency.exponentialRampToValueAtTime(end, start + duration);
      gain.gain.setValueAtTime(0, start); gain.gain.linearRampToValueAtTime(gainValue, start + 0.002);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      osc.connect(gain).connect(output); osc.start(start); osc.stop(start + duration + 0.01); cleanup.push(osc, gain);
    };
    const noise = (duration: number, low: number, end: number, gainValue: number, delay = 0) => {
      const source = c.createBufferSource(), filter = c.createBiquadFilter(), gain = c.createGain(), start = at + delay;
      source.buffer = this.noise; source.playbackRate.value = 0.82 + (seed % 11) * 0.025;
      filter.type = 'lowpass'; filter.Q.value = 0.7; filter.frequency.setValueAtTime(low, start);
      filter.frequency.exponentialRampToValueAtTime(end, start + duration);
      gain.gain.setValueAtTime(0, start); gain.gain.linearRampToValueAtTime(gainValue, start + 0.003);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      source.connect(filter).connect(gain).connect(output); source.start(start, (seed % 5) * 0.1); source.stop(start + duration + 0.01);
      cleanup.push(source, filter, gain); return source;
    };
    let last: AudioBufferSourceNode;
    if (kind === 'shot') {
      // A rising plasma chirp and a short crystalline tail give the cannon a
      // high-energy sci-fi identity without masking rapid follow-up shots.
      tone(310, 2050, 0.1, 0.22, 'sawtooth'); tone(2650, 410, 0.18, 0.14, 'sine');
      last = noise(0.19, 9800, 1250, 0.2);
    } else if (kind === 'impact') {
      tone(470, 85, 0.18, 0.22, 'triangle');
      last = noise(0.22, 8000, 700, 0.6);
    } else {
      tone(large ? 78 : 118, 24, large ? 1.3 : 1.1, 0.7, 'sine');
      tone(340 + seed % 120, 42, 0.42, 0.14, 'triangle', 0.03);
      tone(980 + seed % 280, 105, 0.3, 0.1, 'sawtooth', 0.05);
      noise(0.34, 12000, 1200, 0.92);
      noise(0.72, 2400, 110, 0.58, 0.06);
      last = noise(large ? 1.55 : 1.35, 4200, 120, 0.42, 0.12);
    }
    last.onended = () => { cleanup.forEach(node => node.disconnect()); done(); };
  }
}
