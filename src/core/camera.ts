export class Camera {
  public x = 0;
  public y = 0;

  public begin(context: CanvasRenderingContext2D): void {
    context.save();
    context.translate(-this.x, -this.y);
  }

  public end(context: CanvasRenderingContext2D): void {
    context.restore();
  }
}
