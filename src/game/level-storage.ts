import type { FlightPattern, LevelConfig, TargetConfig, TargetKind } from "./level-types";

const DRAFT_STORAGE_KEY = "moorhuhn-editor-level";
const HIGH_SCORES_STORAGE_KEY = "moorhuhn-high-scores";

const cloneLevel = (level: LevelConfig): LevelConfig => structuredClone(level);
const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;
const asNumber = (value: unknown): number | null => typeof value === "number" && Number.isFinite(value) ? value : null;
const isTargetKind = (value: unknown): value is TargetKind => value === "flying" || value === "static" || value === "penalty";
const isFlightPattern = (value: unknown): value is FlightPattern => value === "wave" || value === "zigzag" || value === "low";

function parseTarget(value: unknown): TargetConfig | null {
  if (!isRecord(value) || !isTargetKind(value.kind) || typeof value.id !== "string") return null;
  const x = asNumber(value.x);
  const y = asNumber(value.y);
  const width = asNumber(value.width);
  const height = asNumber(value.height);
  const points = asNumber(value.points);
  if (x === null || y === null || width === null || height === null || points === null) return null;

  const spawnSource = isRecord(value.spawn) ? value.spawn : {};
  const delay = Math.max(0, asNumber(spawnSource.delay) ?? 0);
  const duration = Math.max(0.5, asNumber(spawnSource.duration) ?? 8);
  const repeatEvery = asNumber(spawnSource.repeatEvery);
  const speed = asNumber(value.speed);
  const flightPattern = isFlightPattern(value.flightPattern) ? value.flightPattern : undefined;

  return {
    id: value.id,
    kind: value.kind,
    x,
    y,
    width,
    height,
    points,
    ...(speed !== null ? { speed } : {}),
    ...(flightPattern ? { flightPattern } : {}),
    spawn: {
      delay,
      duration,
      ...(repeatEvery !== null && repeatEvery > duration ? { repeatEvery } : {}),
    },
  };
}

/** Accepts JSON from the editor and fills sensible defaults for optional fields. */
export function parseLevelConfig(value: unknown): LevelConfig | null {
  if (!isRecord(value) || typeof value.id !== "string" || typeof value.name !== "string" || !Array.isArray(value.targets) || !isRecord(value.weapon)) return null;
  const worldWidth = asNumber(value.worldWidth);
  const roundSeconds = asNumber(value.roundSeconds);
  const magazineSize = asNumber(value.weapon.magazineSize);
  const reloadSeconds = asNumber(value.weapon.reloadSeconds);
  if (worldWidth === null || roundSeconds === null || magazineSize === null || reloadSeconds === null) return null;

  const targets = value.targets.map(parseTarget);
  if (targets.some((target) => target === null)) return null;
  return {
    id: value.id,
    name: value.name,
    worldWidth: Math.max(1920, worldWidth),
    roundSeconds: Math.max(1, roundSeconds),
    weapon: { magazineSize: Math.max(1, magazineSize), reloadSeconds: Math.max(0.1, reloadSeconds) },
    targets: targets as TargetConfig[],
  };
}

export function loadEditorLevel(fallback: LevelConfig): LevelConfig {
  try {
    const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
    return saved ? parseLevelConfig(JSON.parse(saved)) ?? cloneLevel(fallback) : cloneLevel(fallback);
  } catch {
    return cloneLevel(fallback);
  }
}

export function saveEditorLevel(level: LevelConfig): void {
  localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(level));
}

export function clearEditorLevel(): void {
  localStorage.removeItem(DRAFT_STORAGE_KEY);
}

export function getHighScore(levelId: string): number {
  try {
    const scores = JSON.parse(localStorage.getItem(HIGH_SCORES_STORAGE_KEY) ?? "{}") as Record<string, unknown>;
    return typeof scores[levelId] === "number" ? scores[levelId] : 0;
  } catch {
    return 0;
  }
}

/** Stores only a higher score and returns the best score after this round. */
export function recordHighScore(levelId: string, score: number): number {
  try {
    const scores = JSON.parse(localStorage.getItem(HIGH_SCORES_STORAGE_KEY) ?? "{}") as Record<string, unknown>;
    const previous = typeof scores[levelId] === "number" ? scores[levelId] : 0;
    const best = Math.max(previous, score);
    localStorage.setItem(HIGH_SCORES_STORAGE_KEY, JSON.stringify({ ...scores, [levelId]: best }));
    return best;
  } catch {
    return score;
  }
}
