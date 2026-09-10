import { FixedClock } from '../core/Clock';
import { radarSegments } from '../core/WorldWrap';
import { CONFIG } from '../game/config';
import { IDLE_INPUT, SCENARIOS, Simulation } from '../game/Simulation';
import type { ScenarioName } from '../game/Simulation';
import { InputManager } from '../input/InputManager';
import { FlightRenderer } from '../render/Renderer';
import { AudioEngine } from '../audio/AudioEngine';
import { Interface } from '../ui/Interface';
import type { AppMode, Preferences } from '../ui/Interface';
import { ControllerPanel } from '../ui/ControllerPanel';
import { DIFFICULTIES, difficulty } from '../game/Difficulty';
import { Records } from '../game/Records';
import type { PlayerRecord } from '../game/Records';
import { RecordsPanel } from '../ui/RecordsPanel';
import { wavePressure } from '../game/combat/Progression';

function readPreferences(): Preferences {
  const defaults: Preferences = { muted: false, volume: 0.45, reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches, difficulty: 'normal' };
  try {
    const data: unknown = JSON.parse(localStorage.getItem('void-rescue.preferences') ?? '{}');
    if (typeof data !== 'object' || !data) return defaults;
    const value = data as Record<string, unknown>;
    return {
      muted: typeof value.muted === 'boolean' ? value.muted : defaults.muted,
      reducedMotion: typeof value.reducedMotion === 'boolean' ? value.reducedMotion : defaults.reducedMotion,
      volume: typeof value.volume === 'number' && Number.isFinite(value.volume) ? Math.max(0, Math.min(1, value.volume)) : defaults.volume,
      difficulty: difficulty(value.difficulty),
    };
  } catch { return defaults; }
}

export class GameApp {
  private simulation: Simulation;
  private readonly clock = new FixedClock();
  private readonly input = new InputManager();
  private readonly audio = new AudioEngine();
  private readonly graphics: FlightRenderer;
  private readonly ui: Interface;
  private readonly controllerPanel: ControllerPanel;
  private readonly records = new Records();
  private readonly recordsPanel: RecordsPanel;
  private run: Pick<PlayerRecord, 'id' | 'pilot' | 'difficulty' | 'date'> | null = null;
  private mode: AppMode = 'title';
  private preferences = readPreferences();
  private previousTime = 0;
  private raf = 0;
  private disposed = false;
  private failed = false;
  private audioError: string | null = null;
  private lastTeleport = 0;

  constructor(private readonly canvas: HTMLCanvasElement, root: HTMLElement) {
    const params = new URLSearchParams(location.search);
    const rawSeed = Number(params.get('seed') ?? CONFIG.defaultSeed);
    const seed = Number.isFinite(rawSeed) ? rawSeed >>> 0 : CONFIG.defaultSeed;
    this.simulation = new Simulation(seed, 'flight-basic', this.preferences.difficulty);
    this.graphics = new FlightRenderer(canvas, seed, params.get('backend') === 'webgl2');
    this.graphics.renderer.onError = message => this.showError(new Error(message));
    this.graphics.renderer.onDeviceLost = info => this.showError(new Error(`Se perdió el dispositivo gráfico: ${info.message}`));
    this.ui = new Interface(root, {
      start: () => this.start(), resume: () => this.setPaused(false), restart: () => this.restart(),
      menu: () => this.menu(), pause: () => this.setPaused(true), mute: () => this.toggleMute(),
      fullscreen: () => { void this.fullscreen(); }, preferences: value => this.savePreferences(value),
      controller: () => { this.setPaused(true); this.controllerPanel.show(); },
      result: () => this.continueResult(), pilot: value => this.records.setPilot(value),
      records: () => { this.setPaused(true); this.saveRecord(); this.recordsPanel.show(); },
    }, this.preferences, this.records.pilot);
    this.controllerPanel = new ControllerPanel(root, this.input.controller, () => { this.input.clear(); });
    this.recordsPanel = new RecordsPanel(root, this.records, () => { this.input.clear(); });
    this.audio.setMuted(this.preferences.muted);
    this.audio.setVolume(this.preferences.volume);
    window.addEventListener('blur', this.onBlur);
    document.addEventListener('visibilitychange', this.onVisibility);
    window.addEventListener('pagehide', this.onPageHide);
  }

  async init(): Promise<void> {
    await this.graphics.init();
    this.graphics.reset(this.simulation.state, true);
    // Compile visible materials before removing the boot message.
    this.graphics.draw(this.simulation.state, 0, 1 / 60, false, true, this.preferences.reducedMotion);
    document.querySelector('#loading')?.remove();
    this.ui.update(this.simulation.state, this.graphics.metrics(), false);
    if (import.meta.env.DEV) window.__VOID_RESCUE__ = this.diagnostics();
    this.raf = requestAnimationFrame(this.frame);
  }

  private frame = (now: number): void => {
    if (this.disposed || this.failed) return;
    const elapsed = this.previousTime ? Math.max(0, (now - this.previousTime) / 1000) : 1 / 60;
    this.previousTime = now;
    this.input.poll();
    this.controllerPanel.update();
    if (this.input.disconnected && this.mode === 'playing') { this.setPaused(true); this.ui.disconnected(); }
    const menuInput = this.input.menu();
    if (this.recordsPanel.open) {
      if (this.input.consume('pause')) this.recordsPanel.close(); else this.recordsPanel.navigate(menuInput);
    } else if (this.controllerPanel.open) {
      this.input.consume('pause'); this.controllerPanel.navigate(menuInput);
    } else if (this.input.consume('pause')) {
      if (this.mode === 'title') this.start(); else if (this.mode === 'result') this.continueResult(); else this.setPaused(this.mode === 'playing');
    } else if (this.mode !== 'playing') {
      this.ui.navigatePad(menuInput);
    }
    if (this.input.consume('mute')) this.toggleMute();
    if (this.input.consume('restart') && this.mode !== 'title') this.restart();
    if (this.input.consume('diagnostics')) this.ui.toggleDiagnostics();

    let alpha = 0;
    if (this.mode === 'playing') {
      alpha = this.clock.advance(elapsed, dt => {
        // Consume one-shot actions only when a simulation step actually runs.
        const input = { ...this.input.flight(), view: { centerX: this.graphics.rig.x, width: this.graphics.viewWidth } };
        const before = this.simulation.state.shotsFired;
        this.simulation.update(dt, input);
        if (this.simulation.state.shotsFired > before) this.audio.pulse();
      }, DIFFICULTIES[this.preferences.difficulty].speed);
    } else this.clock.reset();
    const state = this.simulation.state;
    const teleport = state.events.find(e => e.id > this.lastTeleport && (e.kind === 'portal' || e.kind === 'respawn'));
    if (teleport) { this.lastTeleport = teleport.id; this.graphics.reset(state, false); }
    if (state.enabled && state.outcome !== 'active' && this.mode === 'playing') {
      this.saveRecord();
      const rank = this.run ? this.records.list().findIndex(record => record.id === this.run!.id) + 1 : 0;
      this.ui.recordStatus(this.run && state.score === 0 ? 'Sin puntos registrados. ¡Inténtalo otra vez!' : this.run
        ? `${this.run.pilot} · ${rank ? `Puesto ${rank}/10 · ${this.records.persistent ? 'Guardado' : 'Solo esta sesión'}` : 'Fuera del top 10'} · ${DIFFICULTIES[this.run.difficulty].label} (mínima usada)`
        : 'Práctica de diagnóstico · no registra récords');
      this.setMode('result');
    }
    this.audio.events(state.events, state.player.x);
    this.audio.update(state.player.thrust, Math.abs(state.player.vx), this.mode === 'playing' && state.player.alive);
    try {
      this.graphics.draw(state, alpha, elapsed, this.mode === 'playing', this.mode === 'title', this.preferences.reducedMotion);
      this.ui.update(state, this.graphics.metrics(), this.input.gamepadConnected, this.preferences.difficulty, this.input.controller.labels());
    } catch (error) {
      this.showError(error);
      return;
    }
    if (!this.failed) this.raf = requestAnimationFrame(this.frame);
  };

  private unlockAudio(): void {
    void this.audio.unlock().then(() => { this.audioError = null; }).catch(error => {
      this.audioError = error instanceof Error ? error.message : String(error);
    });
  }

  private setMode(mode: AppMode): void {
    this.mode = mode;
    this.clock.reset();
    this.input.clear();
    this.ui.mode(mode);
    if (mode === 'playing') this.canvas.focus({ preventScroll: true });
  }

  start(): void {
    this.saveRecord();
    this.run = { id: crypto.randomUUID(), pilot: this.records.pilot, difficulty: this.preferences.difficulty, date: new Date().toISOString() };
    this.unlockAudio();
    this.simulation = new Simulation(this.simulation.state.seed, 'combat-basic', this.preferences.difficulty);
    this.audio.resetEvents(); this.lastTeleport = 0;
    this.graphics.reset(this.simulation.state, false);
    this.setMode('playing');
  }

  restart(): void {
    if (this.simulation.state.enabled) { this.start(); return; }
    this.simulation = new Simulation(this.simulation.state.seed, this.simulation.state.enabled ? 'combat-basic' : 'flight-basic', this.preferences.difficulty);
    this.audio.resetEvents(); this.lastTeleport = 0;
    this.graphics.reset(this.simulation.state, false);
    this.setMode('playing');
  }

  menu(): void {
    this.saveRecord(); this.run = null;
    this.simulation = new Simulation(this.simulation.state.seed, 'flight-basic', this.preferences.difficulty);
    this.audio.resetEvents(); this.lastTeleport = 0;
    this.graphics.reset(this.simulation.state, true);
    this.setMode('title');
  }

  setPaused(value: boolean): void {
    if (this.mode !== 'playing' && this.mode !== 'paused') return;
    this.setMode(value ? 'paused' : 'playing');
    if (!value) this.unlockAudio();
  }

  private toggleMute(): void {
    this.savePreferences({ ...this.preferences, muted: !this.preferences.muted });
    if (!this.preferences.muted && this.mode !== 'title') this.unlockAudio();
  }

  private savePreferences(preferences: Preferences): void {
    if (this.run && DIFFICULTIES[preferences.difficulty].rank < DIFFICULTIES[this.run.difficulty].rank) {
      this.run.difficulty = preferences.difficulty;
      this.saveRecord();
    }
    this.preferences = preferences;
    this.simulation.setDifficulty(preferences.difficulty);
    this.audio.setMuted(preferences.muted);
    this.audio.setVolume(preferences.volume);
    this.ui.syncMuted(preferences.muted);
    try { localStorage.setItem('void-rescue.preferences', JSON.stringify(preferences)); } catch { /* Session settings still work without storage. */ }
  }

  private async fullscreen(): Promise<void> {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.querySelector<HTMLElement>('#app')?.requestFullscreen();
    } catch { /* Browser may deny fullscreen; the fitted viewport remains usable. */ }
  }

  private onBlur = (): void => { if (this.mode === 'playing') this.setPaused(true); };
  private onVisibility = (): void => { if (document.hidden) this.onBlur(); };
  private onPageHide = (): void => { this.saveRecord(); };

  private saveRecord(): void {
    if (!this.run) return;
    this.records.save({ ...this.run, score: this.simulation.state.score, wave: this.simulation.state.wave });
  }

  private continueResult(): void {
    if (this.simulation.nextWave()) {
      this.unlockAudio(); this.audio.resetEvents(); this.lastTeleport = 0;
      this.graphics.reset(this.simulation.state, false); this.setMode('playing');
    } else this.restart();
  }

  private diagnostics() {
    return Object.freeze({
      getState: () => ({ ...this.simulation.snapshot(), mode: this.mode, preferences: { ...this.preferences },
        camera: { x: this.graphics.rig.x, viewWidth: this.graphics.viewWidth,
          radarSegments: radarSegments(this.graphics.rig.x, this.graphics.viewWidth, CONFIG.worldWidth) },
        audio: this.audio.getState() }),
      loadScenario: (name: string, seed = this.simulation.state.seed) => {
        if (!(SCENARIOS as readonly string[]).includes(name)) throw new Error(`Escenario no implementado: ${name}. Disponibles: ${SCENARIOS.join(', ')}`);
        if (!Number.isFinite(seed)) throw new Error('La semilla debe ser finita.');
        this.run = null;
        this.simulation = new Simulation(seed, name as ScenarioName, this.preferences.difficulty);
        this.audio.resetEvents(); this.lastTeleport = 0;
        this.graphics.reset(this.simulation.state, false);
        this.setMode('playing');
      },
      setPaused: (value: boolean) => this.setPaused(value),
      step: (frames: number) => {
        if (this.mode !== 'paused') throw new Error('Pausa la simulación antes de avanzar por cuadros.');
        if (!Number.isInteger(frames) || frames < 0 || frames > 3600) throw new Error('frames debe ser un entero entre 0 y 3600.');
        this.run = null;
        for (let i = 0; i < frames; i++) this.simulation.update(this.clock.dt, IDLE_INPUT);
      },
      getMetrics: () => ({ ...this.graphics.metrics(), seed: this.simulation.state.seed,
        scenario: this.simulation.state.scenario, simulationHz: 60, frame: this.simulation.state.frame,
        entities: { player: Number(this.simulation.state.player.alive), enemies: this.simulation.state.enemies.length,
          colonists: this.simulation.state.colonists.filter(c => c.status !== 'lost').length, projectiles: this.simulation.state.shots.length,
          particles: this.graphics.combat.particleCount },
        wave: { number: this.simulation.state.wave, pressure: wavePressure(this.simulation.state.wave), ranked: Boolean(this.run), outcome: this.simulation.state.outcome, score: this.simulation.state.score, delivered: this.simulation.state.delivered,
          remainingSpawns: this.simulation.state.schedule.length - this.simulation.state.spawnIndex },
        difficulty: this.preferences.difficulty, speed: DIFFICULTIES[this.preferences.difficulty].speed,
        difficultyProfile: { ...DIFFICULTIES[this.preferences.difficulty] },
        controller: this.input.controller.snapshot(), droppedSeconds: this.clock.droppedSeconds, audioError: this.audioError }),
      restart: () => this.restart(),
      listScenarios: () => [...SCENARIOS],
    });
  }

  showError(error: unknown): void {
    if (this.failed || this.disposed) return;
    this.failed = true;
    cancelAnimationFrame(this.raf);
    this.audio.update(0, 0, false);
    const message = error instanceof Error ? error.message : String(error);
    const panel = document.querySelector<HTMLDivElement>('#loading') ?? document.createElement('div');
    panel.id = 'loading'; panel.setAttribute('role', 'alert');
    panel.textContent = `No se pudo continuar el vuelo: ${message}`;
    const fallback = document.createElement('a');
    const url = new URL(location.href);
    url.searchParams.set('backend', 'webgl2');
    fallback.href = url.href;
    fallback.textContent = 'Reiniciar con WebGL2';
    panel.append(fallback);
    document.querySelector('#viewport')?.append(panel);
    console.error(error);
  }

  dispose(): void {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    this.input.dispose(); this.audio.dispose(); this.graphics.dispose();
    window.removeEventListener('blur', this.onBlur);
    document.removeEventListener('visibilitychange', this.onVisibility);
    window.removeEventListener('pagehide', this.onPageHide);
    delete window.__VOID_RESCUE__;
  }
}

export type DebugApi = ReturnType<GameApp['diagnostics']>;
declare global { interface Window { __VOID_RESCUE__?: DebugApi } }
