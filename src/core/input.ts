export type PointerPosition = Readonly<{ x: number; y: number }>;

/** Converts browser pointer events into fixed virtual-canvas coordinates. */
export class Input {
  private pointer: PointerPosition = { x: 0, y: 0 };
  private readonly heldKeys = new Set<string>();
  private primaryPressed = false;
  private readonly pressedKeys = new Set<string>();

  public constructor(private readonly canvas: HTMLCanvasElement) {
    canvas.addEventListener("pointermove", this.updatePointer);
    canvas.addEventListener("pointerdown", this.handlePointerDown);
    canvas.addEventListener("contextmenu", (event) => event.preventDefault());
    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);
    window.addEventListener("blur", this.clearHeldKeys);
  }

  public get pointerPosition(): PointerPosition {
    return this.pointer;
  }

  public isHeld(...codes: string[]): boolean {
    return codes.some((code) => this.heldKeys.has(code));
  }

  public consumePrimaryPress(): boolean {
    const wasPressed = this.primaryPressed;
    this.primaryPressed = false;
    return wasPressed;
  }

  public consumeKeyPress(code: string): boolean {
    const wasPressed = this.pressedKeys.has(code);
    this.pressedKeys.delete(code);
    return wasPressed;
  }

  private updatePointer = (event: PointerEvent): void => {
    const bounds = this.canvas.getBoundingClientRect();
    this.pointer = {
      x: (event.clientX - bounds.left) * (this.canvas.width / bounds.width),
      y: (event.clientY - bounds.top) * (this.canvas.height / bounds.height),
    };
  };

  private handlePointerDown = (event: PointerEvent): void => {
    this.updatePointer(event);
    if (event.button === 0) this.primaryPressed = true;
  };

  private handleKeyDown = (event: KeyboardEvent): void => {
    if (["ArrowLeft", "ArrowRight", "KeyA", "KeyD"].includes(event.code)) {
      event.preventDefault();
    }
    this.heldKeys.add(event.code);
    if (!event.repeat) this.pressedKeys.add(event.code);
  };

  private handleKeyUp = (event: KeyboardEvent): void => {
    this.heldKeys.delete(event.code);
  };

  private clearHeldKeys = (): void => {
    this.heldKeys.clear();
    this.pressedKeys.clear();
  };
}
