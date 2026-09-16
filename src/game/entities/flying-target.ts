import type { HitResult, Target, TargetConfig } from "../level-types";

export class FlyingTarget implements Target {
  private x: number;
  private y: number;
  private direction = 1;
  private age = 0;
  private hitTimeRemaining = 0;

  public constructor(
    private readonly config: TargetConfig,
    private readonly worldWidth: number,
  ) {
    this.x = config.x;
    this.y = config.y;
  }

  public update(deltaSeconds: number): void {
    this.age += deltaSeconds;
    if (this.hitTimeRemaining > 0) {
      this.hitTimeRemaining -= deltaSeconds;
      this.y += 500 * deltaSeconds;
      if (this.hitTimeRemaining <= 0) this.respawn();
      return;
    }

    this.x += this.direction * (this.config.speed ?? 350) * deltaSeconds;
    this.y = this.getFlightY();
    if (this.x > this.worldWidth - 220 || this.x < 220) this.direction *= -1;
  }

  public tryHit(worldX: number, worldY: number): HitResult {
    if (this.hitTimeRemaining > 0) return null;
    const isInside = Math.abs(worldX - this.x) <= this.config.width / 2
      && Math.abs(worldY - this.y) <= this.config.height / 2;
    if (isInside) this.hitTimeRemaining = 0.7;
    return isInside ? { points: this.config.points, label: "Treffer!" } : null;
  }

  public draw(context: CanvasRenderingContext2D): void {
    context.save();
    context.translate(this.x, this.y);
    if (this.hitTimeRemaining > 0) context.rotate(0.8);
    context.scale(this.direction, 1);

    context.fillStyle = "#f4f1de";
    context.beginPath();
    context.ellipse(0, 0, this.config.width / 2, this.config.height / 2, 0, 0, Math.PI * 2);
    context.fill();

    context.fillStyle = "#db4736";
    context.beginPath();
    context.arc(26, -48, 20, 0, Math.PI * 2);
    context.arc(6, -54, 16, 0, Math.PI * 2);
    context.fill();

    context.fillStyle = "#edb146";
    context.beginPath();
    context.moveTo(64, -3);
    context.lineTo(104, 12);
    context.lineTo(64, 24);
    context.fill();

    context.fillStyle = "#252b3a";
    context.beginPath();
    context.arc(42, -18, 7, 0, Math.PI * 2);
    context.fill();

    context.strokeStyle = "#8a5532";
    context.lineWidth = 7;
    context.beginPath();
    context.moveTo(-18, 42);
    context.lineTo(-28, 65);
    context.moveTo(18, 42);
    context.lineTo(28, 65);
    context.stroke();
    context.restore();
  }

  public reset(): void {
    this.x = this.config.x;
    this.y = this.config.y;
    this.direction = 1;
    this.age = 0;
    this.hitTimeRemaining = 0;
  }

  private respawn(): void {
    this.x = this.direction > 0 ? 180 : this.worldWidth - 180;
    this.y = this.config.y;
    this.age = 0;
  }

  private getFlightY(): number {
    switch (this.config.flightPattern) {
      case "zigzag":
        return this.config.y + Math.asin(Math.sin(this.age * 5.4)) * 52;
      case "low":
        return this.config.y + Math.sin(this.age * 4.4) * 35;
      default:
        return this.config.y + Math.sin(this.age * 3.2) * 80;
    }
  }
}
