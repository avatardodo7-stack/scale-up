// All sounds are synthesized with the Web Audio API. No audio files.

type Ctx = AudioContext;

const PENTA = [0, 2, 4, 7, 9];
/** Pitch rises along a major pentatonic scale, so every merge sounds musical. */
const noteFor = (tier: number): number => {
  const i = tier - 1;
  const semis = Math.floor(i / 5) * 12 + PENTA[i % 5];
  return 196 * 2 ** (semis / 12); // from G3 upward
};

class Sfx {
  private ctx: Ctx | null = null;
  private out: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  enabled = true;

  /** Must run inside a user gesture at least once (autoplay policy). */
  unlock(): void {
    if (!this.ctx) {
      const C = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!C) return;
      this.ctx = new C();
      const comp = this.ctx.createDynamicsCompressor();
      comp.threshold.value = -14;
      comp.ratio.value = 4;
      this.out = this.ctx.createGain();
      this.out.gain.value = 0.55;
      this.out.connect(comp).connect(this.ctx.destination);
      const len = Math.floor(this.ctx.sampleRate * 0.25);
      this.noise = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = this.noise.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
  }

  private ready(): Ctx | null {
    if (!this.enabled || !this.ctx || !this.out || this.ctx.state !== 'running') return null;
    return this.ctx;
  }

  private tone(freq: number, t: number, dur: number, peak: number, type: OscillatorType = 'sine', bendFrom?: number): void {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(bendFrom ?? freq, t);
    if (bendFrom) o.frequency.exponentialRampToValueAtTime(freq, t + 0.05);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.out!);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  /** Soft airy swish */
  slide(): void {
    const ctx = this.ready();
    if (!ctx) return;
    const t = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.Q.value = 1.2;
    f.frequency.setValueAtTime(1800, t);
    f.frequency.exponentialRampToValueAtTime(600, t + 0.09);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.07, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.1);
    src.connect(f).connect(g).connect(this.out!);
    src.start(t);
    src.stop(t + 0.12);
  }

  /** Bubbly pop whose pitch rises with the tier */
  pop(tier: number): void {
    const ctx = this.ready();
    if (!ctx) return;
    const t = ctx.currentTime;
    const f = noteFor(tier);
    this.tone(f, t, 0.22, 0.32, 'triangle', f * 1.6);
    this.tone(f * 2, t, 0.14, 0.08, 'sine');
    if (tier >= 10) this.tone(f * 1.5, t + 0.03, 0.35, 0.06, 'sine');
    if (tier >= 12) this.tone(f / 2, t, 0.4, 0.18, 'sine'); // a little weight for big merges
  }

  /** Rising sparkle arpeggio for a first-time discovery */
  discover(): void {
    const ctx = this.ready();
    if (!ctx) return;
    const t = ctx.currentTime + 0.05;
    [0, 4, 7, 12, 16].forEach((s, i) => {
      const f = 523.25 * 2 ** (s / 12);
      this.tone(f, t + i * 0.075, 0.6, 0.14, 'triangle');
      this.tone(f * 3, t + i * 0.075, 0.3, 0.025, 'sine');
    });
  }

  win(): void {
    const ctx = this.ready();
    if (!ctx) return;
    const t = ctx.currentTime + 0.05;
    [0, 4, 7, 12, 7, 12, 16, 19, 24].forEach((s, i) => this.tone(392 * 2 ** (s / 12), t + i * 0.1, 0.7, 0.13, 'triangle'));
  }

  over(): void {
    const ctx = this.ready();
    if (!ctx) return;
    const t = ctx.currentTime + 0.05;
    [7, 4, 0, -5].forEach((s, i) => this.tone(330 * 2 ** (s / 12), t + i * 0.14, 0.5, 0.12, 'triangle'));
  }

  undo(): void {
    const ctx = this.ready();
    if (!ctx) return;
    const t = ctx.currentTime;
    this.tone(660, t, 0.15, 0.1, 'sine', 990);
    this.tone(440, t + 0.07, 0.2, 0.1, 'sine');
  }

  click(): void {
    const ctx = this.ready();
    if (!ctx) return;
    this.tone(880, ctx.currentTime, 0.06, 0.05, 'sine');
  }
}

export const sfx = new Sfx();

let hapticsOn = true;
export const setHaptics = (on: boolean) => { hapticsOn = on; };
export function buzz(pattern: number | number[]): void {
  if (!hapticsOn || typeof navigator.vibrate !== 'function') return;
  try { navigator.vibrate(pattern); } catch { /* ignore */ }
}
