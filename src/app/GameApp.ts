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

function readPreferences(): Preferences {
  const defaults = { muted: false, volume: 0.45, reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches };
  try {
    const data: unknown = JSON.parse(localStorage.getItem('void-rescue.preferences') ?? '{}');
    if (typeof data !== 'object' || !data) return defaults;
    const value = data as Record<string, unknown>;
    return {
      muted: typeof value.muted === 'boolean' ? value.muted : defaults.muted,
      reducedMotion: typeof value.reducedMotion === 'boolean' ? value.reducedMotion : defaults.reducedMotion,
      volume: typeof value.volume === 'number' && Number.isFinite(value.volume) ? Math.max(0, Math.min(1, value.volume)) : defaults.volume,
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
    this.simulation = new Simulation(seed);
    this.graphics = new FlightRenderer(canvas, seed, params.get('backend') === 'webgl2');
    this.graphics.renderer.onError = message => this.showError(new Error(message));
    this.graphics.renderer.onDeviceLost = info => this.showError(new Error(`Se perdió el dispositivo gráfico: ${info.message}`));
    this.ui = new Interface(root, {
      start: () => this.start(), resume: () => this.setPaused(false), restart: () => this.restart(),
      menu: () => this.menu(), pause: () => this.setPaused(true), mute: () => this.toggleMute(),
      fullscreen: () => { void this.fullscreen(); }, preferences: value => this.savePreferences(value),
    }, this.preferences);
    this.audio.setMuted(this.preferences.muted);
    this.audio.setVolume(this.preferences.volume);
    window.addEventListener('blur', this.onBlur);
    document.addEventListener('visibilitychange', this.onVisibility);
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
    if (this.input.disconnected && this.mode === 'playing') { this.setPaused(true); this.ui.disconnected(); }
    const menuInput = this.input.menu();
    if (this.input.consume('pause')) {
      if (this.mode === 'title') this.start(); else if (this.mode === 'result') this.restart(); else this.setPaused(this.mode === 'playing');
    } else if (this.mode !== 'playing') {
      this.ui.navigatePad(menuInput);
    }
    if (this.input.consume('mute')) this.toggleMute();
    if (this.input.consume('restart') && this.mode !== 'title') this.restart();
    if (this.input.consume('diagnostics')) this.ui.toggleDiagnostics();

    let alpha = 0;
    if (this.mode === 'playing') {
      const input = { ...this.input.flight(), view: { centerX: this.graphics.rig.x, width: this.graphics.viewWidth } };
      alpha = this.clock.advance(elapsed, dt => {
        const before = this.simulation.state.shotsFired;
        this.simulation.update(dt, input);
        if (this.simulation.state.shotsFired > before) this.audio.pulse();
      });
    } else this.clock.reset();
    const state = this.simulation.state;
    const teleport = state.events.find(e => e.id > this.lastTeleport && (e.kind === 'portal' || e.kind === 'respawn'));
    if (teleport) { this.lastTeleport = teleport.id; this.graphics.reset(state, false); }
    if (state.enabled && state.outcome !== 'active' && this.mode === 'playing') this.setMode('result');
    this.audio.events(state.events, state.player.x);
    this.audio.update(state.player.thrust, Math.abs(state.player.vx), this.mode === 'playing' && state.player.alive);
    try {
      this.graphics.draw(state, alpha, elapsed, this.mode === 'playing', this.mode === 'title', this.preferences.reducedMotion);
      this.ui.update(state, this.graphics.metrics(), this.input.gamepadConnected);
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
    this.unlockAudio();
    this.simulation = new Simulation(this.simulation.state.seed, 'combat-basic');
    this.audio.resetEvents(); this.lastTeleport = 0;
    this.graphics.reset(this.simulation.state, false);
    this.setMode('playing');
  }

  restart(): void {
    this.simulation = new Simulation(this.simulation.state.seed, this.simulation.state.enabled ? 'combat-basic' : 'flight-basic');
    this.audio.resetEvents(); this.lastTeleport = 0;
    this.graphics.reset(this.simulation.state, false);
    this.setMode('playing');
  }

  menu(): void {
    this.simulation = new Simulation(this.simulation.state.seed);
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
    this.preferences = preferences;
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

  private diagnostics() {
    return Object.freeze({
      getState: () => ({ ...this.simulation.snapshot(), mode: this.mode, preferences: { ...this.preferences },
        camera: { x: this.graphics.rig.x, viewWidth: this.graphics.viewWidth,
          radarSegments: radarSegments(this.graphics.rig.x, this.graphics.viewWidth, CONFIG.worldWidth) },
        audio: this.audio.getState() }),
      loadScenario: (name: string, seed = this.simulation.state.seed) => {
        if (!(SCENARIOS as readonly string[]).includes(name)) throw new Error(`Escenario no implementado: ${name}. Disponibles: ${SCENARIOS.join(', ')}`);
        if (!Number.isFinite(seed)) throw new Error('La semilla debe ser finita.');
        this.simulation = new Simulation(seed, name as ScenarioName);
        this.audio.resetEvents(); this.lastTeleport = 0;
        this.graphics.reset(this.simulation.state, false);
        this.setMode('playing');
      },
      setPaused: (value: boolean) => this.setPaused(value),
      step: (frames: number) => {
        if (this.mode !== 'paused') throw new Error('Pausa la simulación antes de avanzar por cuadros.');
        if (!Number.isInteger(frames) || frames < 0 || frames > 3600) throw new Error('frames debe ser un entero entre 0 y 3600.');
        for (let i = 0; i < frames; i++) this.simulation.update(this.clock.dt, IDLE_INPUT);
      },
      getMetrics: () => ({ ...this.graphics.metrics(), seed: this.simulation.state.seed,
        scenario: this.simulation.state.scenario, simulationHz: 60, frame: this.simulation.state.frame,
        entities: { player: Number(this.simulation.state.player.alive), enemies: this.simulation.state.enemies.length,
          colonists: this.simulation.state.colonists.filter(c => c.status !== 'lost').length, projectiles: this.simulation.state.shots.length,
          particles: this.graphics.combat.particleCount },
        wave: { outcome: this.simulation.state.outcome, score: this.simulation.state.score, delivered: this.simulation.state.delivered,
          remainingSpawns: this.simulation.state.schedule.length - this.simulation.state.spawnIndex },
        droppedSeconds: this.clock.droppedSeconds, audioError: this.audioError }),
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
    delete window.__VOID_RESCUE__;
  }
}

export type DebugApi = ReturnType<GameApp['diagnostics']>;
declare global { interface Window { __VOID_RESCUE__?: DebugApi } }
