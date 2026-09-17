import "../style.css";
import levelData from "../data/prototype-level.json";
import { clearEditorLevel, loadEditorLevel, parseLevelConfig, saveEditorLevel } from "../game/level-storage";
import type { FlightPattern, LevelConfig, TargetConfig, TargetKind } from "../game/level-types";

const canvas = document.querySelector<HTMLCanvasElement>("#editor-canvas")!;
const targetList = document.querySelector<HTMLDivElement>("#target-list")!;
const viewSlider = document.querySelector<HTMLInputElement>("#viewport-x")!;
const levelName = document.querySelector<HTMLInputElement>("#level-name")!;
const roundSeconds = document.querySelector<HTMLInputElement>("#round-seconds")!;
const magazineSize = document.querySelector<HTMLInputElement>("#magazine-size")!;
const targetId = document.querySelector<HTMLInputElement>("#target-id")!;
const targetKind = document.querySelector<HTMLSelectElement>("#target-kind")!;
const targetX = document.querySelector<HTMLInputElement>("#target-x")!;
const targetY = document.querySelector<HTMLInputElement>("#target-y")!;
const targetWidth = document.querySelector<HTMLInputElement>("#target-width")!;
const targetHeight = document.querySelector<HTMLInputElement>("#target-height")!;
const targetPoints = document.querySelector<HTMLInputElement>("#target-points")!;
const targetSpeed = document.querySelector<HTMLInputElement>("#target-speed")!;
const targetPattern = document.querySelector<HTMLSelectElement>("#target-pattern")!;
const spawnDelay = document.querySelector<HTMLInputElement>("#spawn-delay")!;
const spawnDuration = document.querySelector<HTMLInputElement>("#spawn-duration")!;
const spawnRepeat = document.querySelector<HTMLInputElement>("#spawn-repeat")!;
const targetPanel = document.querySelector<HTMLElement>("#target-panel")!;
const addButton = document.querySelector<HTMLButtonElement>("#add-target")!;
const deleteButton = document.querySelector<HTMLButtonElement>("#delete-target")!;
const exportButton = document.querySelector<HTMLButtonElement>("#export-level")!;
const testButton = document.querySelector<HTMLButtonElement>("#test-level")!;
const importInput = document.querySelector<HTMLInputElement>("#import-level")!;
const resetButton = document.querySelector<HTMLButtonElement>("#reset-level")!;
const editorStatus = document.querySelector<HTMLParagraphElement>("#editor-status")!;
const waveTimeline = document.querySelector<HTMLDivElement>("#wave-timeline")!;

if (!canvas || !targetList || !viewSlider || !levelName || !roundSeconds || !magazineSize
  || !targetId || !targetKind || !targetX || !targetY || !targetWidth || !targetHeight || !targetPoints || !targetSpeed || !targetPattern
  || !spawnDelay || !spawnDuration || !spawnRepeat || !targetPanel || !addButton || !deleteButton || !exportButton
  || !testButton || !importInput || !resetButton || !editorStatus || !waveTimeline) {
  throw new Error("Level editor could not initialize.");
}

const context = canvas.getContext("2d")!;
if (!context) throw new Error("Canvas 2D context is not available.");

const defaultLevel = levelData as LevelConfig;
let level = loadEditorLevel(defaultLevel);
const viewWidth = canvas.width;
let viewX = 0;
let selectedIndex: number | null = 0;
let isDragging = false;

const getSelectedTarget = (): TargetConfig | null => selectedIndex === null ? null : level.targets[selectedIndex] ?? null;
const setValue = (element: HTMLInputElement | HTMLSelectElement, value: string | number): void => { element.value = String(value); };

function drawBackground(): void {
  context.fillStyle = "#bfe8f4";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#91b879";
  for (let x = -240; x < canvas.width + 300; x += 500) {
    context.beginPath();
    context.arc(x, 720, 290, Math.PI, Math.PI * 2);
    context.fill();
  }
  context.fillStyle = "#79b85b";
  context.fillRect(0, 720, canvas.width, canvas.height - 720);
}

function drawTarget(target: TargetConfig, index: number): void {
  const x = target.x - viewX;
  const y = target.y;
  const isSelected = index === selectedIndex;
  const color = target.kind === "penalty" ? "#df5a51" : target.kind === "static" ? "#f6c945" : "#f4f1de";

  context.save();
  context.translate(x, y);
  context.fillStyle = color;
  context.beginPath();
  context.ellipse(0, 0, target.width / 2, target.height / 2, 0, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#233044";
  context.font = "700 22px system-ui, sans-serif";
  context.textAlign = "center";
  context.fillText(target.kind === "flying" ? "H" : target.kind === "static" ? "+" : "!", 0, 8);
  context.setLineDash(isSelected ? [12, 8] : [6, 6]);
  context.strokeStyle = isSelected ? "#fff" : "rgb(35 48 68 / 60%)";
  context.lineWidth = isSelected ? 5 : 2;
  context.strokeRect(-target.width / 2, -target.height / 2, target.width, target.height);
  context.setLineDash([]);
  context.fillStyle = "#233044";
  context.font = "600 18px system-ui, sans-serif";
  context.fillText(target.id, 0, 88);
  context.restore();
}

function renderCanvas(): void {
  drawBackground();
  context.strokeStyle = "rgb(255 255 255 / 26%)";
  context.lineWidth = 1;
  for (let worldX = Math.ceil(viewX / 400) * 400; worldX < viewX + viewWidth; worldX += 400) {
    const x = worldX - viewX;
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, canvas.height);
    context.stroke();
    context.fillStyle = "rgb(32 48 64 / 70%)";
    context.font = "16px system-ui, sans-serif";
    context.fillText(`${worldX}`, x + 8, 30);
  }
  level.targets.forEach(drawTarget);
  context.fillStyle = "#24384c";
  context.font = "600 22px system-ui, sans-serif";
  context.fillText(`${level.name} · Ausschnitt ${Math.round(viewX)}–${Math.round(viewX + viewWidth)}`, 28, 1060);
}

function renderTargetList(): void {
  targetList.replaceChildren(...level.targets.map((target, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = index === selectedIndex ? "target-list-item is-selected" : "target-list-item";
    button.textContent = `${target.kind === "penalty" ? "⚠" : target.kind === "static" ? "◎" : "◌"} ${target.id} · ${target.points > 0 ? "+" : ""}${target.points} · ab ${target.spawn.delay}s`;
    button.addEventListener("click", () => {
      selectedIndex = index;
      renderAll();
    });
    return button;
  }));
}

function renderTimeline(): void {
  waveTimeline.replaceChildren(...level.targets.map((target, index) => {
    const row = document.createElement("div");
    row.className = index === selectedIndex ? "timeline-row is-selected" : "timeline-row";
    const label = document.createElement("span");
    label.className = "timeline-label";
    label.textContent = target.id;
    const track = document.createElement("div");
    track.className = "timeline-track";
    const repeatEvery = target.spawn.repeatEvery ?? Number.POSITIVE_INFINITY;
    for (let start = target.spawn.delay; start < level.roundSeconds; start += repeatEvery) {
      const duration = Math.min(target.spawn.duration, level.roundSeconds - start);
      const block = document.createElement("button");
      block.type = "button";
      block.className = `timeline-block ${target.kind}`;
      block.style.left = `${(start / level.roundSeconds) * 100}%`;
      block.style.width = `${Math.max(1, (duration / level.roundSeconds) * 100)}%`;
      block.title = `${target.id}: ${start.toFixed(1)}–${(start + duration).toFixed(1)} s`;
      block.addEventListener("click", () => { selectedIndex = index; renderAll(); });
      track.append(block);
    }
    row.append(label, track);
    return row;
  }));
}

function renderForm(): void {
  levelName.value = level.name;
  setValue(roundSeconds, level.roundSeconds);
  setValue(magazineSize, level.weapon.magazineSize);
  const target = getSelectedTarget();
  targetPanel.hidden = target === null;
  if (!target) return;
  targetId.value = target.id;
  setValue(targetKind, target.kind);
  setValue(targetX, target.x);
  setValue(targetY, target.y);
  setValue(targetWidth, target.width);
  setValue(targetHeight, target.height);
  setValue(targetPoints, target.points);
  targetSpeed.value = target.speed === undefined ? "" : String(target.speed);
  setValue(targetPattern, target.flightPattern ?? "wave");
  setValue(spawnDelay, target.spawn.delay);
  setValue(spawnDuration, target.spawn.duration);
  spawnRepeat.value = target.spawn.repeatEvery === undefined ? "" : String(target.spawn.repeatEvery);
}

function renderAll(): void {
  renderCanvas();
  renderTargetList();
  renderTimeline();
  renderForm();
}

function canvasPosition(event: PointerEvent): { x: number; y: number } {
  const bounds = canvas.getBoundingClientRect();
  return {
    x: viewX + (event.clientX - bounds.left) * (canvas.width / bounds.width),
    y: (event.clientY - bounds.top) * (canvas.height / bounds.height),
  };
}

function selectTargetAt(position: { x: number; y: number }): void {
  selectedIndex = null;
  for (let index = level.targets.length - 1; index >= 0; index -= 1) {
    const target = level.targets[index];
    if (Math.abs(target.x - position.x) <= target.width / 2 && Math.abs(target.y - position.y) <= target.height / 2) {
      selectedIndex = index;
      break;
    }
  }
}

canvas.addEventListener("pointerdown", (event) => {
  const position = canvasPosition(event);
  selectTargetAt(position);
  isDragging = selectedIndex !== null;
  if (isDragging) canvas.setPointerCapture(event.pointerId);
  renderAll();
});

canvas.addEventListener("pointermove", (event) => {
  if (!isDragging) return;
  const target = getSelectedTarget();
  if (!target) return;
  const position = canvasPosition(event);
  target.x = Math.round(Math.max(0, Math.min(level.worldWidth, position.x)));
  target.y = Math.round(Math.max(80, Math.min(960, position.y)));
  renderAll();
});

canvas.addEventListener("pointerup", () => { isDragging = false; });
viewSlider.addEventListener("input", () => { viewX = Number(viewSlider.value); renderCanvas(); });
levelName.addEventListener("input", () => { level.name = levelName.value; renderCanvas(); });
roundSeconds.addEventListener("input", () => { level.roundSeconds = Math.max(1, Number(roundSeconds.value)); });
magazineSize.addEventListener("input", () => { level.weapon.magazineSize = Math.max(1, Number(magazineSize.value)); });

const updateSelectedTarget = (): void => {
  const target = getSelectedTarget();
  if (!target) return;
  target.id = targetId.value.trim() || target.id;
  target.kind = targetKind.value as TargetKind;
  target.x = Number(targetX.value);
  target.y = Number(targetY.value);
  target.width = Math.max(20, Number(targetWidth.value));
  target.height = Math.max(20, Number(targetHeight.value));
  target.points = Number(targetPoints.value);
  const speed = Number(targetSpeed.value);
  if (target.kind === "flying" && speed > 0) target.speed = speed;
  else delete target.speed;
  if (target.kind === "flying") target.flightPattern = targetPattern.value as FlightPattern;
  else delete target.flightPattern;
  target.spawn.delay = Math.max(0, Number(spawnDelay.value));
  target.spawn.duration = Math.max(0.5, Number(spawnDuration.value));
  const repeat = Number(spawnRepeat.value);
  if (repeat > target.spawn.duration) target.spawn.repeatEvery = repeat;
  else delete target.spawn.repeatEvery;
  renderAll();
};

[targetId, targetKind, targetX, targetY, targetWidth, targetHeight, targetPoints, targetSpeed, targetPattern, spawnDelay, spawnDuration, spawnRepeat].forEach((element) => element.addEventListener("input", updateSelectedTarget));
addButton.addEventListener("click", () => {
  const index = level.targets.length + 1;
  level.targets.push({
    id: `new-target-${index}`,
    kind: "static",
    x: Math.round(viewX + 960),
    y: 580,
    width: 112,
    height: 112,
    points: 100,
    flightPattern: "wave",
    spawn: { delay: 0, duration: 8, repeatEvery: 12 },
  });
  selectedIndex = level.targets.length - 1;
  renderAll();
});
deleteButton.addEventListener("click", () => {
  if (selectedIndex === null) return;
  level.targets.splice(selectedIndex, 1);
  selectedIndex = level.targets.length === 0 ? null : Math.min(selectedIndex, level.targets.length - 1);
  renderAll();
});
exportButton.addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(level, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${level.id}.json`;
  link.click();
  URL.revokeObjectURL(url);
  editorStatus.textContent = "JSON wurde exportiert.";
});

testButton.addEventListener("click", () => {
  saveEditorLevel(level);
  window.location.assign("/");
});

importInput.addEventListener("change", async () => {
  const file = importInput.files?.[0];
  if (!file) return;
  try {
    const imported = parseLevelConfig(JSON.parse(await file.text()));
    if (!imported) throw new Error("invalid level");
    level = imported;
    viewX = 0;
    viewSlider.value = "0";
    viewSlider.max = String(Math.max(0, level.worldWidth - viewWidth));
    selectedIndex = level.targets.length === 0 ? null : 0;
    editorStatus.textContent = `„${level.name}“ wurde importiert.`;
    renderAll();
  } catch {
    editorStatus.textContent = "Die Datei ist kein gültiges Moorhuhn-Level.";
  } finally {
    importInput.value = "";
  }
});

resetButton.addEventListener("click", () => {
  clearEditorLevel();
  level = structuredClone(defaultLevel);
  viewX = 0;
  viewSlider.value = "0";
  selectedIndex = level.targets.length === 0 ? null : 0;
  editorStatus.textContent = "Ausgangslevel wiederhergestellt.";
  renderAll();
});

viewSlider.max = String(Math.max(0, level.worldWidth - viewWidth));
renderAll();
