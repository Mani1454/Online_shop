/**
 * Web Audio API Sound Synthesizer for Shopkeeper Order Alerts
 * Generates clear, high-priority harmonic chime tones without external audio file dependencies.
 */

class SoundEffectsService {
  private audioCtx: AudioContext | null = null;
  private intervalId: number | null = null;
  private isMuted: boolean = false;

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioCtxClass =
        window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  /**
   * Play a pleasant dual-tone shop bell (C5 -> G5)
   */
  public playSingleChime() {
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Tone 1: C5 (523.25 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(523.25, now);
    gain1.gain.setValueAtTime(0.3, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.45);

    // Tone 2: G5 (783.99 Hz) delayed by 120ms
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(783.99, now + 0.12);
    gain2.gain.setValueAtTime(0.35, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.65);
  }

  /**
   * Start looping the chime until stopped by the shopkeeper
   */
  public startOrderAlertLoop() {
    if (this.intervalId !== null) return; // Already looping

    this.playSingleChime();
    this.intervalId = window.setInterval(() => {
      this.playSingleChime();
    }, 1800);
  }

  /**
   * Stop the looping alert (called when shopkeeper taps 'Accept')
   */
  public stopOrderAlertLoop() {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.stopOrderAlertLoop();
    }
    return this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public isAlertLooping(): boolean {
    return this.intervalId !== null;
  }
}

export const soundEffects = new SoundEffectsService();
