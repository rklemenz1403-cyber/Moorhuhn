import { Camera } from "../core/camera";
import { VIRTUAL_HEIGHT, VIRTUAL_WIDTH } from "../core/constants";
import { Input } from "../core/input";
import { Renderer } from "../core/renderer";
import levelData from "../data/prototype-level.json";
import { FlyingTarget } from "./entities/flying-target";
import { SpawnedTarget } from "./entities/spawned-target";
import { StaticTarget } from "./entities/static-target";
import { loadEditorLevel } from "./level-storage";
import type { LevelConfig, Target } from "./level-types";

type FloatingText = { x: number; y: number; text: string; color: string; timeRemaining: number };
type HitParticle = { x: number; y: number; vx: number; vy: number; timeRemaining: number; color: string };

export class Game {
  private static readonly CAMERA_SPEED = 850;
  private readonly level: LevelConfig;
  private readonly camera = new Camera();
  private readonly targets: Target[];
  private previousTime = 0;
  private animationFrame = 0;
  private roundTimeRemaining: number;
  private isRoundOver = false;
  private score = 0;
  private ammo: number;
  private reloadTimeRemaining = 0;
  private shotFlashTimeRemaining = 0;
  private lastShotHit = false;
  private lastShotText = "";
  private combo = 0;
  private comboTimeRemaining = 0;
  private hits = 0;
  private misses = 0;
  private readonly floatingTexts: FloatingText[] = [];
  private readonly hitParticles: HitParticle[] = [];

  public constructor(
    private readonly renderer: Renderer,
    private readonly input: Input,
  ) {
    this.level = loadEditorLevel(levelData as LevelConfig);
    this.roundTimeRemaining = this.level.roundSeconds;
    this.ammo = this.level.weapon.magazineSize;
    this.targets = this.level.targets.map((config) => new SpawnedTarget(
      config.kind === "flying"
        ? new FlyingTarget(config, this.level.worldWidth)
        : new StaticTarget(config),
      config,
    ));
  }

  public start(): void {
    this.animationFrame = requestAnimationFrame(this.loop);
  }

  public stop(): void {
    cancelAnimationFrame(this.animationFrame);
  }

  private loop = (time: number): void => {
    const deltaSeconds = Math.min((time - this.previousTime) / 1000, 0.1);
    this.previousTime = time;
    this.update(deltaSeconds);
    this.render();
    this.animationFrame = requestAnimationFrame(this.loop);
  };

  private update(deltaSeconds: number): void {
    if (this.isRoundOver) {
      if (this.input.consumeKeyPress("Enter")) this.restartRound();
      return;
    }

    this.roundTimeRemaining = Math.max(0, this.roundTimeRemaining - deltaSeconds);
    if (this.roundTimeRemaining === 0) {
      this.isRoundOver = true;
      return;
    }
    const direction = Number(this.input.isHeld("ArrowRight", "KeyD"))
      - Number(this.input.isHeld("ArrowLeft", "KeyA"));
    const nextX = this.camera.x + direction * Game.CAMERA_SPEED * deltaSeconds;
    this.camera.x = Math.max(0, Math.min(this.level.worldWidth - VIRTUAL_WIDTH, nextX));
    this.targets.forEach((target) => target.update(deltaSeconds));
    this.updateFeedback(deltaSeconds);

    this.reloadTimeRemaining = Math.max(0, this.reloadTimeRemaining - deltaSeconds);
    this.shotFlashTimeRemaining = Math.max(0, this.shotFlashTimeRemaining - deltaSeconds);
    if (this.reloadTimeRemaining === 0 && this.ammo === 0) this.ammo = this.level.weapon.magazineSize;

    if (this.input.consumeKeyPress("KeyR") && this.ammo < this.level.weapon.magazineSize) this.startReload();
    if (this.input.consumePrimaryPress()) this.fire();
  }

  private render(): void {
    const { context } = this.renderer;
    this.renderer.clear();

    this.camera.begin(context);
    this.drawPrototypeBackdrop(context);
    this.targets.forEach((target) => target.draw(context));
    this.camera.end(context);

    this.drawOverlay(context);
    if (this.isRoundOver) this.drawRoundOver(context);
  }

  private drawPrototypeBackdrop(context: CanvasRenderingContext2D): void {
    context.fillStyle = "#bfe8f4";
    context.fillRect(0, 0, this.level.worldWidth, 720);

    context.fillStyle = "#eff7e0";
    context.beginPath();
    context.arc(680, 220, 76, 0, Math.PI * 2);
    context.arc(2500, 140, 58, 0, Math.PI * 2);
    context.arc(5100, 250, 90, 0, Math.PI * 2);
    context.fill();

    this.drawDistantHills(context);
    context.fillStyle = "#79b85b";
    context.fillRect(0, 720, this.level.worldWidth, VIRTUAL_HEIGHT - 720);
    context.fillStyle = "#5a9648";
    context.beginPath();
    for (let x = -180; x < this.level.worldWidth + 400; x += 500) {
      context.arc(x, 760, 280 + ((x / 500) % 3) * 38, Math.PI, Math.PI * 2);
    }
    context.fill();

    for (let x = 420; x < this.level.worldWidth; x += 920) {
      this.drawTree(context, x, 560 + ((x / 920) % 2) * 65);
    }
    this.drawBarn(context, 2640, 520);
    this.drawSignpost(context, 4550, 720, "Testgebiet");
  }

  private drawDistantHills(context: CanvasRenderingContext2D): void {
    context.fillStyle = "#91b879";
    context.beginPath();
    context.moveTo(0, 720);
    for (let x = 0; x <= this.level.worldWidth; x += 360) {
      context.quadraticCurveTo(x + 180, 470 + (x % 720 ? 55 : 0), x + 360, 720);
    }
    context.closePath();
    context.fill();
  }

  private drawTree(context: CanvasRenderingContext2D, x: number, y: number): void {
    context.fillStyle = "#754a2d";
    context.fillRect(x - 22, y, 44, 190);
    context.fillStyle = "#3e7d43";
    context.beginPath();
    context.arc(x, y - 20, 105, 0, Math.PI * 2);
    context.arc(x - 75, y + 50, 78, 0, Math.PI * 2);
    context.arc(x + 78, y + 50, 78, 0, Math.PI * 2);
    context.fill();
  }

  private drawBarn(context: CanvasRenderingContext2D, x: number, y: number): void {
    context.fillStyle = "#b73c32";
    context.fillRect(x, y, 330, 260);
    context.beginPath();
    context.moveTo(x - 30, y);
    context.lineTo(x + 165, y - 170);
    context.lineTo(x + 360, y);
    context.fill();
    context.fillStyle = "#553621";
    context.fillRect(x + 118, y + 115, 94, 145);
  }

  private drawSignpost(context: CanvasRenderingContext2D, x: number, y: number, label: string): void {
    context.fillStyle = "#6d4429";
    context.fillRect(x, y - 140, 18, 140);
    context.fillStyle = "#ead59c";
    context.fillRect(x - 100, y - 210, 220, 76);
    context.fillStyle = "#3b2d20";
    context.font = "600 24px system-ui, sans-serif";
    context.fillText(label, x - 78, y - 162);
  }

  private drawOverlay(context: CanvasRenderingContext2D): void {
    const pointer = this.input.pointerPosition;
    context.strokeStyle = this.shotFlashTimeRemaining > 0 ? "#ffd34e" : "#fff";
    context.lineWidth = 3;
    context.beginPath();
    context.arc(pointer.x, pointer.y, 18, 0, Math.PI * 2);
    context.moveTo(pointer.x - 28, pointer.y);
    context.lineTo(pointer.x + 28, pointer.y);
    context.moveTo(pointer.x, pointer.y - 28);
    context.lineTo(pointer.x, pointer.y + 28);
    context.stroke();

    context.fillStyle = "rgb(11 27 42 / 76%)";
    context.fillRect(24, 24, 410, 268);
    context.strokeStyle = "rgb(255 255 255 / 22%)";
    context.lineWidth = 2;
    context.strokeRect(24, 24, 410, 268);

    context.fillStyle = "#fff";
    context.font = "700 30px system-ui, sans-serif";
    context.fillText(this.level.name, 48, 66);
    context.fillStyle = "#b9dbe9";
    context.font = "600 20px system-ui, sans-serif";
    context.fillText(`Zeit  ${this.formatTime(this.roundTimeRemaining)}`, 48, 106);
    context.fillText(`Punkte  ${this.score}`, 48, 140);
    context.fillText(this.reloadTimeRemaining > 0 ? "Munition  lädt nach …" : `Munition  ${this.ammo} / ${this.level.weapon.magazineSize}`, 48, 174);
    context.fillStyle = "#f6c945";
    context.font = "600 17px system-ui, sans-serif";
    context.fillText(this.combo > 1 ? `Combo ×${this.combo}` : "Wellenmodus aktiv", 48, 214);
    context.fillStyle = "#dceaf0";
    context.font = "16px system-ui, sans-serif";
    context.fillText("A / D bzw. ← / → bewegen", 48, 246);
    context.fillText("Klick schießen · R nachladen", 48, 270);
    if (this.shotFlashTimeRemaining > 0) {
      context.fillStyle = this.lastShotHit ? "#ffe66d" : "#ffd5cf";
      context.font = "600 26px system-ui, sans-serif";
      context.fillText(this.lastShotText, pointer.x + 32, pointer.y - 26);
    }
    context.fillStyle = "rgb(11 27 42 / 76%)";
    context.fillRect(VIRTUAL_WIDTH - 340, 24, 316, 48);
    context.fillStyle = "#dceaf0";
    context.font = "16px system-ui, sans-serif";
    context.textAlign = "right";
    context.fillText(`Position ${Math.round(this.camera.x)} / ${this.level.worldWidth - VIRTUAL_WIDTH}`, VIRTUAL_WIDTH - 42, 55);
    context.textAlign = "left";
    this.drawHitFeedback(context);
  }

  private fire(): void {
    if (this.reloadTimeRemaining > 0) return;
    if (this.ammo === 0) {
      this.startReload();
      return;
    }

    this.ammo -= 1;
    this.shotFlashTimeRemaining = 0.18;
    const pointer = this.input.pointerPosition;
    const hit = this.targets.map((target) => target.tryHit(pointer.x + this.camera.x, pointer.y + this.camera.y))
      .find((result) => result !== null);
    this.lastShotHit = hit !== undefined;
    if (hit) this.registerHit(hit, pointer);
    else this.registerMiss(pointer);
    if (this.ammo === 0) this.startReload();
  }

  private registerHit(hit: { points: number; label: string }, pointer: { x: number; y: number }): void {
    this.hits += 1;
    let awardedPoints = hit.points;
    if (hit.points > 0) {
      this.combo = this.comboTimeRemaining > 0 ? this.combo + 1 : 1;
      this.comboTimeRemaining = 1.8;
      const multiplier = Math.min(3, 1 + Math.floor((this.combo - 1) / 3));
      awardedPoints *= multiplier;
      this.lastShotText = multiplier > 1 ? `+${awardedPoints} · Combo ×${multiplier}` : `+${awardedPoints} ${hit.label}`;
      this.addHitFeedback(pointer, this.lastShotText, "#ffe66d");
    } else {
      this.combo = 0;
      this.comboTimeRemaining = 0;
      this.lastShotText = `${awardedPoints} ${hit.label}`;
      this.addHitFeedback(pointer, this.lastShotText, "#ffaaa3");
    }
    this.score += awardedPoints;
  }

  private registerMiss(pointer: { x: number; y: number }): void {
    this.misses += 1;
    this.combo = 0;
    this.comboTimeRemaining = 0;
    this.lastShotText = "Daneben";
    this.addHitFeedback(pointer, "Daneben", "#ffd5cf", 4);
  }

  private addHitFeedback(pointer: { x: number; y: number }, text: string, color: string, particleCount = 12): void {
    this.floatingTexts.push({ x: pointer.x, y: pointer.y - 30, text, color, timeRemaining: 0.9 });
    for (let index = 0; index < particleCount; index += 1) {
      const angle = (Math.PI * 2 * index) / particleCount;
      const speed = 100 + Math.random() * 160;
      this.hitParticles.push({
        x: pointer.x,
        y: pointer.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        timeRemaining: 0.45 + Math.random() * 0.25,
        color,
      });
    }
  }

  private updateFeedback(deltaSeconds: number): void {
    this.comboTimeRemaining = Math.max(0, this.comboTimeRemaining - deltaSeconds);
    if (this.comboTimeRemaining === 0) this.combo = 0;
    for (const label of this.floatingTexts) {
      label.timeRemaining -= deltaSeconds;
      label.y -= 52 * deltaSeconds;
    }
    for (const particle of this.hitParticles) {
      particle.timeRemaining -= deltaSeconds;
      particle.x += particle.vx * deltaSeconds;
      particle.y += particle.vy * deltaSeconds;
      particle.vy += 350 * deltaSeconds;
    }
    for (let index = this.floatingTexts.length - 1; index >= 0; index -= 1) {
      if (this.floatingTexts[index].timeRemaining <= 0) this.floatingTexts.splice(index, 1);
    }
    for (let index = this.hitParticles.length - 1; index >= 0; index -= 1) {
      if (this.hitParticles[index].timeRemaining <= 0) this.hitParticles.splice(index, 1);
    }
  }

  private drawHitFeedback(context: CanvasRenderingContext2D): void {
    for (const particle of this.hitParticles) {
      context.globalAlpha = Math.max(0, particle.timeRemaining * 1.8);
      context.fillStyle = particle.color;
      context.beginPath();
      context.arc(particle.x, particle.y, 5, 0, Math.PI * 2);
      context.fill();
    }
    context.globalAlpha = 1;
    context.textAlign = "center";
    context.font = "700 30px system-ui, sans-serif";
    for (const label of this.floatingTexts) {
      context.globalAlpha = Math.min(1, label.timeRemaining * 2);
      context.fillStyle = label.color;
      context.fillText(label.text, label.x, label.y);
    }
    context.globalAlpha = 1;
    context.textAlign = "left";
  }

  private startReload(): void {
    if (this.reloadTimeRemaining === 0) this.reloadTimeRemaining = this.level.weapon.reloadSeconds;
  }

  private restartRound(): void {
    this.camera.x = 0;
    this.roundTimeRemaining = this.level.roundSeconds;
    this.isRoundOver = false;
    this.score = 0;
    this.ammo = this.level.weapon.magazineSize;
    this.reloadTimeRemaining = 0;
    this.combo = 0;
    this.comboTimeRemaining = 0;
    this.hits = 0;
    this.misses = 0;
    this.floatingTexts.length = 0;
    this.hitParticles.length = 0;
    this.targets.forEach((target) => target.reset());
  }

  private formatTime(seconds: number): string {
    const wholeSeconds = Math.ceil(seconds);
    return `${Math.floor(wholeSeconds / 60).toString().padStart(2, "0")}:${(wholeSeconds % 60).toString().padStart(2, "0")}`;
  }

  private drawRoundOver(context: CanvasRenderingContext2D): void {
    context.fillStyle = "rgb(8 20 34 / 78%)";
    context.fillRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);
    context.textAlign = "center";
    context.fillStyle = "#fff";
    context.font = "700 78px system-ui, sans-serif";
    context.fillText("Runde beendet", VIRTUAL_WIDTH / 2, 400);
    context.font = "600 42px system-ui, sans-serif";
    context.fillText(`Endstand: ${this.score} Punkte`, VIRTUAL_WIDTH / 2, 482);
    context.font = "500 28px system-ui, sans-serif";
    context.fillText(`Treffer ${this.hits} · Fehlschüsse ${this.misses}`, VIRTUAL_WIDTH / 2, 530);
    context.fillStyle = "#f6c945";
    context.font = "600 30px system-ui, sans-serif";
    context.fillText("Enter drücken, um erneut zu starten", VIRTUAL_WIDTH / 2, 600);
    context.textAlign = "left";
  }
}
