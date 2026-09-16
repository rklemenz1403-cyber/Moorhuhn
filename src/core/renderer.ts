import { VIRTUAL_HEIGHT, VIRTUAL_WIDTH } from "./constants";

export class Renderer {
  public readonly context: CanvasRenderingContext2D;

  public constructor(canvas: HTMLCanvasElement) {
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas 2D context is not available.");
    this.context = context;
    this.context.imageSmoothingEnabled = true;
  }

  public clear(color = "#82c9ed"): void {
    this.context.fillStyle = color;
    this.context.fillRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);
  }
}
