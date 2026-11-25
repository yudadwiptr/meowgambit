import type { PieceSymbol } from 'chess.js';
import type { EmoteKey } from '../types/game';

class SoundEngine {
  private ctx: AudioContext | null = null;
  private muted = false;

  private ensureContext(): AudioContext | null {
    if (this.muted) return null;
    if (typeof window === 'undefined') return null;

    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public setMuted(val: boolean): void {
    this.muted = val;
  }

  public toggleMute(): boolean {
    this.muted = !this.muted;
    if (!this.muted) {
      this.playSelect();
    }
    return this.muted;
  }

  /** High retro arcade blip on piece selection */
  public playSelect(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(660, now);
    osc.frequency.exponentialRampToValueAtTime(990, now + 0.055);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.065);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.07);
  }

  /** Punchy wooden thud for normal piece movement */
  public playMove(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(195, now);
    osc.frequency.exponentialRampToValueAtTime(68, now + 0.09);

    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.11);

    // Subtle click transient
    const clickOsc = ctx.createOscillator();
    const clickGain = ctx.createGain();
    clickOsc.type = 'sine';
    clickOsc.frequency.setValueAtTime(520, now);
    clickOsc.frequency.exponentialRampToValueAtTime(180, now + 0.025);
    clickGain.gain.setValueAtTime(0.09, now);
    clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
    clickOsc.connect(clickGain);
    clickGain.connect(ctx.destination);
    clickOsc.start(now);
    clickOsc.stop(now + 0.032);
  }

  /** Crisp double-thud + chime for castling */
  public playCastle(): void {
    this.playMove();
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime + 0.09;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(240, now);
    osc.frequency.exponentialRampToValueAtTime(85, now + 0.08);
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  /** Noise burst + frequency sweep tailored by capturing piece */
  public playSkillCapture(piece: PieceSymbol = 'q'): void {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // 1. Filtered noise burst for slash / impact crunch
    const bufferSize = Math.floor(ctx.sampleRate * 0.22);
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 1.8);
    }
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = piece === 'b' ? 'bandpass' : 'highpass';
    filter.frequency.setValueAtTime(piece === 'r' ? 400 : 1200, now);
    filter.frequency.exponentialRampToValueAtTime(piece === 'b' ? 3200 : 280, now + 0.2);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.22, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(now);

    // 2. Retro synth frequency sweep
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();

    if (piece === 'b') {
      // Laser / Howl beam sweep
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(1400, now);
      osc.frequency.exponentialRampToValueAtTime(240, now + 0.28);
    } else if (piece === 'r') {
      // Heavy ground-pound sub drop
      osc.type = 'square';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(42, now + 0.3);
    } else if (piece === 'q') {
      // Royal fury / Alpha strike dual high-to-low burst
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(980, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.26);
    } else if (piece === 'n') {
      // Neon pounce / Dash tackle rising-then-impact
      osc.type = 'square';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.1);
      osc.frequency.exponentialRampToValueAtTime(130, now + 0.24);
    } else {
      // Quick scratch / Snap bite
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(720, now);
      osc.frequency.exponentialRampToValueAtTime(190, now + 0.16);
    }

    oscGain.gain.setValueAtTime(0.14, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(oscGain);
    oscGain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.31);
  }

  /** Expanding sonic roar / bastion aura hum for King movement/escape */
  public playKingAura(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.exponentialRampToValueAtTime(520, now + 0.18);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.36);

    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.4);
  }

  /** Dual-tone arcade check alarm */
  public playCheck(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [880, 1174.66];
    notes.forEach((freq, idx) => {
      const start = now + idx * 0.11;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.12, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.13);
    });
  }

  /** Upbeat retro victory fanfare arpeggio */
  public playVictory(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const melody = [
      { f: 523.25, t: 0, d: 0.12 },
      { f: 659.25, t: 0.11, d: 0.12 },
      { f: 783.99, t: 0.22, d: 0.12 },
      { f: 1046.5, t: 0.34, d: 0.36 },
      { f: 783.99, t: 0.54, d: 0.12 },
      { f: 1046.5, t: 0.66, d: 0.48 },
    ];

    melody.forEach(({ f, t, d }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(f, now + t);
      gain.gain.setValueAtTime(0.1, now + t);
      gain.gain.exponentialRampToValueAtTime(0.001, now + t + d);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + t);
      osc.stop(now + t + d + 0.02);
    });
  }

  /** Descending arcade game-over / draw jingle */
  public playDefeat(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [440, 392, 349.23, 293.66];
    notes.forEach((f, i) => {
      const start = now + i * 0.14;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f, start);
      gain.gain.setValueAtTime(0.09, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.19);
    });
  }

  /** Synthesized arcade animal sounds for the Emote Bar */
  public playEmote(emote: EmoteKey): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    if (emote === 'meow') {
      // Cute formant-like cat meow pitch arch
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(860, now + 0.12);
      osc.frequency.exponentialRampToValueAtTime(480, now + 0.36);

      filter.type = 'bandpass';
      filter.Q.setValueAtTime(4, now);
      filter.frequency.setValueAtTime(1200, now);
      filter.frequency.exponentialRampToValueAtTime(2100, now + 0.12);
      filter.frequency.exponentialRampToValueAtTime(900, now + 0.36);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.22, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.4);
    } else if (emote === 'hiss') {
      // Sharp cat hiss via bandpass-swept white noise
      const len = Math.floor(ctx.sampleRate * 0.32);
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const ch = buf.getChannelData(0);
      for (let i = 0; i < len; i++) {
        ch[i] = Math.random() * 2 - 1;
      }
      const src = ctx.createBufferSource();
      src.buffer = buf;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.Q.setValueAtTime(2.5, now);
      filter.frequency.setValueAtTime(3400, now);
      filter.frequency.exponentialRampToValueAtTime(5200, now + 0.12);
      filter.frequency.exponentialRampToValueAtTime(2200, now + 0.32);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.2, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

      src.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      src.start(now);
    } else if (emote === 'woof') {
      // Punchy double dog bark
      [0, 0.16].forEach((offset) => {
        const t = now + offset;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(260, t);
        osc.frequency.exponentialRampToValueAtTime(115, t + 0.11);

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(850, t);

        gain.gain.setValueAtTime(0.22, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.13);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.14);
      });
    } else {
      // GG! Arcade coin / powerup chime
      const notes = [783.99, 1046.5, 1318.51];
      notes.forEach((f, idx) => {
        const t = now + idx * 0.065;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(f, t);
        gain.gain.setValueAtTime(0.09, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.15);
      });
    }
  }
}

export const soundEngine = new SoundEngine();
