import type { HitResult, Target, TargetConfig } from "../level-types";

export class StaticTarget implements Target {
  private active = true;
  private respawnTimeRemaining = 0;

  public constructor(private readonly config: TargetConfig) {}

  public update(deltaSeconds: number): void {
    if (!this.active) {
      this.respawnTimeRemaining -= deltaSeconds;
      if (this.respawnTimeRemaining <= 0) this.active = true;
    }
  }

  public tryHit(worldX: number, worldY: number): HitResult {
    if (!this.active || !this.contains(worldX, worldY)) return null;
    this.active = false;
    this.respawnTimeRemaining = 2.5;
    return {
      points: this.config.points,
      label: this.config.kind === "penalty" ? "Freund getroffen!" : "Volltreffer!",
    };
  }

  public draw(context: CanvasRenderingContext2D): void {
    if (!this.active) return;
    context.save();
    context.translate(this.config.x, this.config.y);
    if (this.config.kind === "penalty") this.drawFriendlyHen(context);
    else this.drawGoldenTarget(context);
    context.restore();
  }

  public reset(): void {
    this.active = true;
    this.respawnTimeRemaining = 0;
  }

  private contains(worldX: number, worldY: number): boolean {
    return Math.abs(worldX - this.config.x) <= this.config.width / 2
      && Math.abs(worldY - this.config.y) <= this.config.height / 2;
  }

  private drawGoldenTarget(context: CanvasRenderingContext2D): void {
    context.fillStyle = "#704222";
    context.fillRect(-8, 42, 16, 92);
    context.fillStyle = "#f6c945";
    context.beginPath();
    context.arc(0, 0, 62, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = "#e66d31";
    context.beginPath();
    context.arc(0, 0, 36, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = "#fff4d6";
    context.beginPath();
    context.arc(0, 0, 13, 0, Math.PI * 2);
    context.fill();
  }

  private drawFriendlyHen(context: CanvasRenderingContext2D): void {
    context.fillStyle = "#f6f0dd";
    context.beginPath();
    context.ellipse(0, 6, 58, 54, 0, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = "#5cb8d3";
    context.beginPath();
    context.arc(-6, -42, 26, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = "#edb146";
    context.beginPath();
    context.moveTo(52, 2);
    context.lineTo(84, 15);
    context.lineTo(52, 26);
    context.fill();
    context.fillStyle = "#252b3a";
    context.beginPath();
    context.arc(31, -12, 6, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = "#e34b43";
    context.font = "600 20px system-ui, sans-serif";
    context.textAlign = "center";
    context.fillText("NICHT!", 0, -92);
    context.textAlign = "left";
  }
}
