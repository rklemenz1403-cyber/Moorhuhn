import "./style.css";
import { AudioSystem } from "./core/audio";
import { Input } from "./core/input";
import { Renderer } from "./core/renderer";
import { Game } from "./game/game";

const canvas = document.querySelector<HTMLCanvasElement>("#game");
if (!canvas) throw new Error("Game canvas was not found.");

const renderer = new Renderer(canvas);
const input = new Input(canvas);
const audio = new AudioSystem();
const game = new Game(renderer, input, audio);
game.start();

window.addEventListener("beforeunload", () => game.stop());
