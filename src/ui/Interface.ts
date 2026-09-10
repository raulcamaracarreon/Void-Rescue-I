import { CONTROL_LABELS } from '../input/bindings';
import type { FlightState } from '../game/Simulation';
import type { RenderMetrics } from '../render/Renderer';
import { Radar } from './Radar';

export type AppMode = 'title' | 'playing' | 'paused';
export interface Preferences { muted: boolean; volume: number; reducedMotion: boolean }
export interface UiActions {
  start(): void; resume(): void; restart(): void; menu(): void; pause(): void;
  mute(): void; fullscreen(): void; preferences(value: Preferences): void;
}

export class Interface {
  private readonly title: HTMLElement;
  private readonly hud: HTMLElement;
  private readonly pause: HTMLDialogElement;
  private readonly radar: Radar;
  private readonly diagnostics: HTMLElement;
  private readonly speed: HTMLElement;
  private readonly altitude: HTMLElement;
  private readonly coordinate: HTMLElement;
  private readonly timer: HTMLElement;
  private readonly distance: HTMLElement;
  private readonly throttle: HTMLElement;
  private readonly device: HTMLElement;
  private readonly muteButton: HTMLButtonElement;
  private readonly backend: HTMLElement;
  private readonly reduced: HTMLInputElement;
  private readonly volume: HTMLInputElement;
  private readonly muteCheck: HTMLInputElement;
  private debugVisible = false;
  private lastMode: AppMode = 'title';

  constructor(private readonly root: HTMLElement, actions: UiActions, preferences: Preferences) {
    root.innerHTML = `
      <section class="title-screen" aria-labelledby="game-title">
        <div class="topline"><span class="brandmark">V<span>R</span></span><span>COLONIAL RESPONSE DIVISION</span><span class="build-tag">PRUEBA DE VUELO · 0.1</span></div>
        <div class="title-copy">
          <p class="eyebrow"><i></i> SECTOR 07 / PERÍMETRO EXTERIOR</p>
          <h1 id="game-title">VOID<br><span>RESCUE</span><b>↗</b></h1>
          <p class="tagline">La colonia está lejos.<br>Tu nave es su primera respuesta.</p>
          <p class="title-description">Reconoce el perímetro. Domina la inercia.<br>El rescate comienza con un buen piloto.</p>
          <button class="primary" data-action="start">INICIAR VUELO <span>↗</span></button>
          <div class="title-controls"><span><kbd>W A S D</kbd> Pilotar</span><span><kbd>ESPACIO</kbd> Disparo de prueba</span></div>
          <p class="gamepad-note">Mando: stick o cruceta · botón sur para disparar · Start para iniciar / pausar</p>
        </div>
        <div class="ship-caption"><span class="caption-line"></span><p>VR—01 <b>RESPONDER</b></p><small>NAVE DE RESPUESTA RÁPIDA</small></div>
        <div class="title-footer"><span><i></i> SISTEMAS DE VUELO LISTOS</span><span>SIMULACIÓN LOCAL / SIN CONEXIÓN EXTERNA</span><button data-action="fullscreen" class="text-button">PANTALLA COMPLETA ↗</button></div>
      </section>
      <section class="flight-hud" aria-label="Instrumentos de vuelo" hidden>
        <header class="instrument-panel">
          <div class="hud-identity"><span class="brandmark">V<span>R</span></span><p>VOID RESCUE<small>VR—01 / RESPONDER</small></p></div>
          <div class="radar-panel"><div class="radar-label"><span>RADAR / PERÍMETRO COMPLETO</span><span>◇ ESTACIÓN <b>▸ NAVE</b></span></div><canvas id="radar" aria-label="Radar panorámico del mundo circular"></canvas><div class="radar-scale"><span>0000</span><span>0600</span><span>1200</span><span>1800</span><span>2400</span></div></div>
          <div class="hud-actions"><button data-action="mute" aria-label="Silenciar audio" title="Silenciar (M)">AUDIO ON</button><button data-action="pause" aria-label="Pausar vuelo" title="Pausa (Esc)">II <span>PAUSA</span></button></div>
        </header>
        <div class="mission"><span class="mission-index">01</span><div><p>RECONOCIMIENTO ORBITAL</p><span>Prueba de vuelo · explora el perímetro circular</span></div><span class="mission-status">VUELO LIBRE</span></div>
        <div class="coordinates"><span>SECTOR <b id="coordinate">0360</b></span><span>TIEMPO <b id="timer">00:00</b></span></div>
        <div class="flight-data"><div><span>VELOCIDAD</span><strong id="speed">000</strong><small>u/s</small><div class="throttle"><i id="throttle"></i></div></div><div><span>ALTITUD</span><strong id="altitude">054</strong><small>u</small></div><div class="distance-block"><span>DISTANCIA RECORRIDA</span><b id="distance">0000 u</b><small>◇ 3 estaciones de referencia</small></div></div>
        <footer class="flight-footer"><div>${CONTROL_LABELS.map(([key, label]) => `<span><kbd>${key}</kbd> ${label}</span>`).join('')}</div><span id="device">TECLADO</span></footer>
      </section>
      <dialog class="pause-dialog" aria-labelledby="pause-title">
        <p class="eyebrow">VR—01 / SISTEMAS EN ESPERA</p><h2 id="pause-title">Vuelo en pausa<span>.</span></h2>
        <p class="pause-note">El perímetro puede esperar.</p>
        <label class="setting">Volumen <input id="volume" type="range" min="0" max="100" step="5" aria-label="Volumen"></label>
        <label class="setting">Silenciar audio <input id="muted" type="checkbox"></label>
        <label class="setting">Reducir movimiento y destellos <input id="reduced" type="checkbox"></label>
        <button class="primary" data-action="resume">CONTINUAR VUELO <span>↗</span></button>
        <div class="pause-secondary"><button data-action="restart">Reiniciar vuelo</button><button data-action="menu">Volver al menú</button></div>
        <button class="text-button pause-fullscreen" data-action="fullscreen">PANTALLA COMPLETA ↗</button>
      </dialog>
      <aside class="diagnostics" hidden aria-label="Diagnóstico"><strong>TELEMETRÍA / F3</strong><pre id="metrics"></pre></aside>
      <span class="backend-tag" id="backend"></span>`;

    const get = <T extends Element>(selector: string) => {
      const element = root.querySelector<T>(selector);
      if (!element) throw new Error(`Falta interfaz ${selector}`);
      return element;
    };
    this.title = get('.title-screen'); this.hud = get('.flight-hud'); this.pause = get('.pause-dialog');
    this.radar = new Radar(get('#radar')); this.diagnostics = get('.diagnostics');
    this.speed = get('#speed'); this.altitude = get('#altitude'); this.coordinate = get('#coordinate');
    this.timer = get('#timer'); this.distance = get('#distance'); this.throttle = get('#throttle');
    this.device = get('#device'); this.muteButton = get('[data-action="mute"]'); this.backend = get('#backend');
    this.volume = get('#volume'); this.reduced = get('#reduced'); this.muteCheck = get('#muted');
    this.volume.value = String(preferences.volume * 100); this.reduced.checked = preferences.reducedMotion; this.muteCheck.checked = preferences.muted;
    this.syncMuted(preferences.muted);

    root.querySelectorAll<HTMLButtonElement>('[data-action]').forEach(button => {
      button.addEventListener('click', () => {
        const action = button.dataset.action as Exclude<keyof UiActions, 'preferences'>;
        actions[action]();
      });
    });
    this.pause.addEventListener('cancel', event => { event.preventDefault(); actions.resume(); });
    for (const input of [this.volume, this.reduced, this.muteCheck]) input.addEventListener('input', () => {
      actions.preferences({ volume: Number(this.volume.value) / 100, reducedMotion: this.reduced.checked, muted: this.muteCheck.checked });
    });
  }

  mode(mode: AppMode): void {
    this.title.hidden = mode !== 'title'; this.hud.hidden = mode === 'title';
    if (mode === 'paused' && !this.pause.open) this.pause.showModal();
    if (mode !== 'paused' && this.pause.open) this.pause.close();
    if (mode === 'title' && this.lastMode !== 'title') this.root.querySelector<HTMLButtonElement>('[data-action="start"]')?.focus();
    this.lastMode = mode;
  }

  syncMuted(muted: boolean): void {
    this.muteCheck.checked = muted;
    this.muteButton.textContent = muted ? 'AUDIO OFF' : 'AUDIO ON';
    this.muteButton.setAttribute('aria-label', muted ? 'Activar audio' : 'Silenciar audio');
    this.muteButton.setAttribute('aria-pressed', String(muted));
  }

  toggleDiagnostics(): void { this.debugVisible = !this.debugVisible; this.diagnostics.hidden = !this.debugVisible; }

  update(state: FlightState, metrics: RenderMetrics, gamepad: boolean): void {
    this.speed.textContent = String(Math.round(Math.abs(state.player.vx))).padStart(3, '0');
    this.altitude.textContent = String(Math.round(state.player.y)).padStart(3, '0');
    this.coordinate.textContent = String(Math.floor(state.player.x)).padStart(4, '0');
    this.timer.textContent = `${String(Math.floor(state.time / 60)).padStart(2, '0')}:${String(Math.floor(state.time % 60)).padStart(2, '0')}`;
    this.distance.textContent = `${String(Math.floor(state.distance)).padStart(4, '0')} u`;
    this.throttle.style.width = `${Math.abs(state.player.vx) / 70 * 100}%`;
    this.device.textContent = gamepad ? 'MANDO CONECTADO' : 'TECLADO';
    this.backend.textContent = metrics.backend.toUpperCase();
    if (!this.hud.hidden) this.radar.draw(state, metrics.cameraX, metrics.viewWidth);
    if (this.debugVisible) this.root.querySelector('#metrics')!.textContent = [
      `${metrics.backend.toUpperCase()} · ${metrics.width} × ${metrics.height} · DPR ${metrics.pixelRatio}`,
      `${metrics.fps.toFixed(1)} FPS / ${metrics.frameMs.toFixed(2)} ms`,
      `${metrics.drawCalls} draw calls / ${metrics.triangles.toLocaleString()} triángulos`,
      `Geometrías ${metrics.geometries} · Texturas ${metrics.textures}`,
      `Semilla ${state.seed} · Frame ${state.frame}`,
      `Escenario ${state.scenario} · Cruces ${state.laps}`,
      `X ${state.player.x.toFixed(2)} · Y ${state.player.y.toFixed(2)}`,
      `Proyectiles ${state.shots.length} · Cámara ${metrics.cameraX.toFixed(2)}`,
    ].join('\n');
  }
}
