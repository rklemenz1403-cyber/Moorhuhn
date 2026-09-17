/** Lightweight synthesized feedback sounds. No audio assets are required. */
export class AudioSystem {
  private context: AudioContext | null = null;
  private muted = false;

  public get isMuted(): boolean { return this.muted; }
  public toggleMuted(): void { this.muted = !this.muted; }

  public playStart(): void { this.tone(440, 0.1, "sine", 0.06); this.tone(660, 0.14, "sine", 0.08, 0.08); }
  public playShot(): void { this.tone(130, 0.07, "square", 0.05); }
  public playHit(): void { this.tone(740, 0.08, "triangle", 0.07); this.tone(990, 0.13, "triangle", 0.06, 0.06); }
  public playMiss(): void { this.tone(180, 0.08, "sawtooth", 0.035); }
  public playReload(): void { this.tone(260, 0.06, "square", 0.04); this.tone(360, 0.08, "square", 0.04, 0.11); }
  public playRoundEnd(): void { this.tone(440, 0.16, "sine", 0.06); this.tone(330, 0.25, "sine", 0.06, 0.18); }

  private tone(frequency: number, duration: number, type: OscillatorType, volume: number, delay = 0): void {
    if (this.muted) return;
    const context = this.getContext();
    if (!context) return;
    if (context.state === "suspended") void context.resume();
    const start = context.currentTime + delay;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(start);
    oscillator.stop(start + duration);
  }

  private getContext(): AudioContext | null {
    if (this.context) return this.context;
    try {
      this.context = new AudioContext();
      return this.context;
    } catch {
      return null;
    }
  }
}
