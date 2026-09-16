import "./style.css";
import { Input } from "./core/input";
import { Renderer } from "./core/renderer";
import { Game } from "./game/game";

const canvas = document.querySelector<HTMLCanvasElement>("#game");
if (!canvas) throw new Error("Game canvas was not found.");

const renderer = new Renderer(canvas);
const input = new Input(canvas);
const game = new Game(renderer, input);
game.start();

window.addEventListener("beforeunload", () => game.stop());
