export type TargetKind = "flying" | "static" | "penalty";
export type FlightPattern = "wave" | "zigzag" | "low";

export type SpawnConfig = {
  /** Seconds from round start until the object first becomes active. */
  delay: number;
  /** Seconds the object remains available in each wave. */
  duration: number;
  /** Seconds between the starts of two waves. Omit for a single appearance. */
  repeatEvery?: number;
};

export type TargetConfig = {
  id: string;
  kind: TargetKind;
  x: number;
  y: number;
  width: number;
  height: number;
  points: number;
  speed?: number;
  flightPattern?: FlightPattern;
  spawn: SpawnConfig;
};

export type LevelConfig = {
  id: string;
  name: string;
  worldWidth: number;
  roundSeconds: number;
  weapon: { magazineSize: number; reloadSeconds: number };
  targets: TargetConfig[];
};

export type HitResult = { points: number; label: string } | null;

export interface Target {
  update(deltaSeconds: number): void;
  draw(context: CanvasRenderingContext2D): void;
  tryHit(worldX: number, worldY: number): HitResult;
  reset(): void;
}
