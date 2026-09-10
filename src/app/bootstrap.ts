import { GameApp } from './GameApp';
import '../ui/style.css';

const canvas = document.querySelector<HTMLCanvasElement>('#game');
const ui = document.querySelector<HTMLElement>('#ui');
if (!canvas || !ui) throw new Error('Falta el contenedor de VOID RESCUE.');
const app = new GameApp(canvas, ui);
void app.init().catch(error => app.showError(error));
if (import.meta.hot) import.meta.hot.dispose(() => app.dispose());
