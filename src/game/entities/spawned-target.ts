import type { HitResult, Target, TargetConfig } from "../level-types";

/** Gives every target a repeatable, data-driven visibility window. */
export class SpawnedTarget implements Target {
  private elapsedSeconds = 0;
  private active = false;

  public constructor(
    private readonly target: Target,
    private readonly config: TargetConfig,
  ) {}

  public update(deltaSeconds: number): void {
    this.elapsedSeconds += deltaSeconds;
    const shouldBeActive = this.isInSpawnWindow();
    if (shouldBeActive && !this.active) this.target.reset();
    this.active = shouldBeActive;
    if (this.active) this.target.update(deltaSeconds);
  }

  public draw(context: CanvasRenderingContext2D): void {
    if (this.active) this.target.draw(context);
  }

  public tryHit(worldX: number, worldY: number): HitResult {
    return this.active ? this.target.tryHit(worldX, worldY) : null;
  }

  public reset(): void {
    this.elapsedSeconds = 0;
    this.active = false;
    this.target.reset();
  }

  private isInSpawnWindow(): boolean {
    const { delay, duration, repeatEvery } = this.config.spawn;
    if (this.elapsedSeconds < delay) return false;
    if (repeatEvery === undefined) return this.elapsedSeconds < delay + duration;
    return (this.elapsedSeconds - delay) % repeatEvery < duration;
  }
}
