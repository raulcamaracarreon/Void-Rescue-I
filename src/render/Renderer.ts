import {
  ACESFilmicToneMapping, BoxGeometry, DirectionalLight, HemisphereLight,
  Mesh, OrthographicCamera, Scene, SRGBColorSpace, WebGPURenderer,
} from 'three/webgpu';
import type { Object3D, BufferGeometry, Material } from 'three/webgpu';
import { nearCameraX, wrappedLerp } from '../core/WorldWrap';
import { CONFIG } from '../game/config';
import type { FlightState } from '../game/Simulation';
import { CameraRig } from './CameraRig';
import { createShip } from './models/Ship';
import { emission } from './materials';
import { WorldScene } from './WorldScene';

export function disposeTree(root: Object3D): void {
  const geometries = new Set<BufferGeometry>(), materials = new Set<Material>();
  root.traverse(object => {
    if (object instanceof Mesh) {
      geometries.add(object.geometry);
      for (const material of Array.isArray(object.material) ? object.material : [object.material]) materials.add(material);
    }
  });
  geometries.forEach(geometry => geometry.dispose());
  materials.forEach(material => material.dispose());
}

export interface RenderMetrics {
  backend: 'webgpu' | 'webgl2'; fps: number; frameMs: number;
  drawCalls: number; triangles: number; geometries: number; textures: number;
  width: number; height: number; pixelRatio: number; cameraX: number; viewWidth: number;
}

export class FlightRenderer {
  readonly renderer: WebGPURenderer;
  readonly scene = new Scene();
  readonly camera = new OrthographicCamera(-100, 100, 56, -56, 0.1, 400);
  readonly rig: CameraRig;
  backend: 'webgpu' | 'webgl2' = 'webgl2';
  private world: WorldScene;
  private seed: number;
  private readonly ship = createShip();
  private readonly shots = new Map<number, Mesh>();
  private readonly shotGeometry = new BoxGeometry(3.4, 0.14, 0.15);
  private readonly shotMaterial = emission(0xbffff1);
  private facingAngle = 0;
  private frameTimes: number[] = [];
  private width = 1;
  private height = 1;
  private readonly observer: ResizeObserver;

  constructor(canvas: HTMLCanvasElement, seed: number, forceWebGL: boolean) {
    this.seed = seed;
    this.rig = new CameraRig(CONFIG.startX);
    this.renderer = new WebGPURenderer({ canvas, antialias: true, forceWebGL, powerPreference: 'high-performance' });
    this.renderer.outputColorSpace = SRGBColorSpace;
    this.renderer.toneMapping = ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.25;
    this.renderer.info.autoReset = false;
    this.camera.position.set(0, 52, 120);
    this.world = new WorldScene(seed);
    this.scene.add(this.world.group, this.world.backdrop, this.ship.group);
    const hemisphere = new HemisphereLight(0x8fc8df, 0x1c292f, 2.0);
    const key = new DirectionalLight(0xe0ebdf, 3.7);
    key.position.set(-40, 100, 80);
    const rim = new DirectionalLight(0x609fc0, 2.2);
    rim.position.set(20, 30, -60);
    this.scene.add(hemisphere, key, rim);
    this.observer = new ResizeObserver(() => this.resize(canvas));
    this.observer.observe(canvas);
    this.resize(canvas);
  }

  async init(): Promise<void> {
    await this.renderer.init();
    this.backend = 'isWebGPUBackend' in this.renderer.backend ? 'webgpu' : 'webgl2';
  }

  private resize(canvas: HTMLCanvasElement): void {
    const rect = canvas.getBoundingClientRect();
    this.width = Math.max(1, Math.round(rect.width));
    this.height = Math.max(1, Math.round(rect.height));
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    this.renderer.setSize(this.width, this.height, false);
    this.camera.left = -this.viewWidth / 2;
    this.camera.right = this.viewWidth / 2;
    this.camera.updateProjectionMatrix();
  }

  get viewWidth(): number { return CONFIG.viewHeight * this.width / this.height; }

  reset(state: FlightState, title: boolean): void {
    this.rig.reset(state.player.x, title);
    this.facingAngle = state.player.facing === 1 ? 0 : Math.PI;
    this.frameTimes = [];
    if (state.seed !== this.seed) {
      this.scene.remove(this.world.group, this.world.backdrop);
      disposeTree(this.world.group); disposeTree(this.world.backdrop);
      this.seed = state.seed;
      this.world = new WorldScene(state.seed);
      this.scene.add(this.world.group, this.world.backdrop);
    }
  }

  draw(state: FlightState, alpha: number, elapsed: number, active: boolean, title: boolean, reducedMotion: boolean): void {
    const p = state.player;
    const playerX = active ? wrappedLerp(p.previousX, p.x, alpha, CONFIG.worldWidth) : p.x;
    if (!title) this.rig.update(playerX, p.vx, p.facing, elapsed, reducedMotion);
    this.camera.position.x = this.rig.x;
    this.world.update(this.rig.x, this.viewWidth);
    const y = active ? p.previousY + (p.y - p.previousY) * alpha : p.y;
    this.ship.group.position.set(nearCameraX(playerX, this.rig.x, CONFIG.worldWidth), y, 0);
    const targetAngle = p.facing === 1 ? 0 : Math.PI;
    this.facingAngle += (targetAngle - this.facingAngle) * (reducedMotion ? 1 : 1 - Math.exp(-24 * elapsed));
    // Mirror the silhouette while keeping its readable, detailed side toward the camera.
    const scale = title ? 2.1 : 1;
    this.ship.group.scale.set(scale * p.facing, scale, scale);
    this.ship.group.rotation.y = Math.sin(this.facingAngle) * 0.3;
    this.ship.group.rotation.x = 0.24 + (reducedMotion ? 0 : p.vy * 0.006);
    this.ship.group.rotation.z = reducedMotion ? 0 : p.vy * 0.0018 * p.facing;
    this.ship.thrust.value = reducedMotion ? 0.5 : 0.55 + p.thrust * 0.4;
    for (const plume of this.ship.exhausts) {
      const length = 2.5 + p.thrust * 5;
      plume.scale.set(length, 0.65 + p.thrust * 0.18, 1);
      plume.position.x = -4.56 - length / 2;
    }
    const ids = new Set(state.shots.map(shot => shot.id));
    for (const [id, mesh] of this.shots) {
      if (!ids.has(id)) { this.scene.remove(mesh); this.shots.delete(id); }
    }
    for (const shot of state.shots) {
      let mesh = this.shots.get(shot.id);
      if (!mesh) {
        mesh = new Mesh(this.shotGeometry, this.shotMaterial);
        this.shots.set(shot.id, mesh);
        this.scene.add(mesh);
      }
      mesh.position.set(nearCameraX(shot.x, this.rig.x, CONFIG.worldWidth), shot.y, 0.8);
    }
    this.renderer.info.reset();
    this.renderer.render(this.scene, this.camera);
    if (elapsed > 0 && elapsed < 0.5) {
      this.frameTimes.push(elapsed);
      if (this.frameTimes.length > 180) this.frameTimes.shift();
    }
  }

  metrics(): RenderMetrics {
    const seconds = this.frameTimes.reduce((a, b) => a + b, 0) / (this.frameTimes.length || 1);
    const info = this.renderer.info;
    return { backend: this.backend, fps: seconds ? 1 / seconds : 0, frameMs: seconds * 1000,
      drawCalls: info.render.drawCalls, triangles: info.render.triangles,
      geometries: info.memory.geometries, textures: info.memory.textures,
      width: this.width, height: this.height, pixelRatio: this.renderer.getPixelRatio(),
      cameraX: this.rig.x, viewWidth: this.viewWidth };
  }

  dispose(): void {
    this.observer.disconnect();
    disposeTree(this.scene);
    this.shotGeometry.dispose(); this.shotMaterial.dispose();
    this.renderer.dispose();
  }
}
