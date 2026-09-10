import { AdditiveBlending, BoxGeometry, Color, DoubleSide, Group, InstancedMesh, Mesh, MeshBasicNodeMaterial, Object3D, PlaneGeometry } from 'three/webgpu';
import { float, materialOpacity, smoothstep, uv } from 'three/tsl';
import type { GameEvent } from '../game/combat/types';
import { nearCameraX } from '../core/WorldWrap';
import { CONFIG } from '../game/config';
import { metal } from './materials';

function glow(): MeshBasicNodeMaterial {
  const m = new MeshBasicNodeMaterial({ transparent: true, depthWrite: false, side: DoubleSide, toneMapped: false, blending: AdditiveBlending });
  m.opacityNode = float(1).sub(smoothstep(0.04, 0.5, uv().sub(0.5).length())).pow(2).mul(materialOpacity); return m;
}

/** Stable per-particle noise avoids the decorative golden-angle spiral. */
function noise(seed: number): number {
  let value = seed >>> 0;
  value = Math.imul(value ^ (value >>> 16), 0x45d9f3b);
  value = Math.imul(value ^ (value >>> 16), 0x45d9f3b);
  return ((value ^ (value >>> 16)) >>> 0) / 0xffffffff;
}

export class DestructionEffects {
  readonly group = new Group();
  private readonly sparks = new InstancedMesh(new PlaneGeometry(1, 1), glow(), 1536);
  private readonly debris = new InstancedMesh(new BoxGeometry(1, 0.45, 0.35), metal(0xffffff, 0.45, 0.6), 128);
  private readonly clouds = new InstancedMesh(new PlaneGeometry(1, 1), glow(), 96);
  private readonly flashes: Mesh<PlaneGeometry, MeshBasicNodeMaterial>[] = [];
  private readonly helper = new Object3D();
  private readonly tint = new Color();
  count = 0;
  constructor() {
    for (const pool of [this.sparks, this.debris, this.clouds]) {
      pool.count = 0; pool.frustumCulled = false; pool.setColorAt(0, new Color(0xffffff)); this.group.add(pool);
    }
    for (let i = 0; i < 12; i++) { const flash = new Mesh(new PlaneGeometry(1, 1), glow()); flash.visible = false; this.flashes.push(flash); this.group.add(flash); }
  }
  update(events: GameEvent[], now: number, cameraX: number, width: number, reduced: boolean): void {
    let sparkCount = 0, debrisCount = 0, cloudCount = 0, flashCount = 0;
    this.flashes.forEach(f => { f.visible = false; });
    for (let n = events.length - 1; n >= 0; n--) {
      const event = events[n]!, age = now - event.time;
      if (age < 0 || !['spawn', 'impact', 'explosion', 'player-hit', 'bomb'].includes(event.kind)) continue;
      const x = nearCameraX(event.x, cameraX, CONFIG.worldWidth);
      const impact = event.kind === 'impact', spawning = event.kind === 'spawn', large = event.kind === 'bomb' || event.kind === 'player-hit';
      const duration = impact ? 0.3 : spawning ? 0.65 : large ? 1.45 : 1.25;
      if (age > duration) continue;
      const reach = impact ? 14 : spawning ? width * 0.45 : width * 0.75;
      if (Math.abs(x - cameraX) > width / 2 + reach) continue;
      const scale = impact ? 0.35 : large ? 1.4 : 1;
      if (!spawning && age < 0.16 && flashCount < this.flashes.length) {
        const flash = this.flashes[flashCount++]!;
        flash.visible = true; flash.position.set(x, event.y, 14);
        flash.scale.setScalar((4 + age * 26) * scale);
        flash.material.color.set(0xffd19a); flash.material.opacity = (1 - age / 0.16) * (reduced ? 0.2 : 0.9);
      }
      const amount = reduced ? 20 : impact ? 16 : spawning ? 100 : large ? 240 : 180;
      for (let i = 0; i < amount && sparkCount < 1536; i++) {
        const random = noise(event.id * 73856093 + i * 19349663);
        const variation = noise(event.id * 83492791 + i * 2971215073);
        const angle = variation * Math.PI * 2;
        const lifetime = spawning ? 0.38 + random * 0.24 : impact ? 0.16 + random * 0.14 : 0.65 + random * (large ? 0.8 : 0.6);
        if (age > lifetime) continue;
        const progress = Math.min(1, age / lifetime);
        const travel = spawning
          ? width * (0.12 + random * 0.43) * (1 - progress)
          : (impact ? 20 + random * 38 : 85 + random * 265) * scale * (1 - Math.exp(-age * 2.4)) / 2.4;
        this.helper.position.set(x + Math.cos(angle) * travel, event.y + Math.sin(angle) * travel - (spawning ? 0 : age * age * (8 + random * 22)), 14);
        this.helper.rotation.set(0, 0, angle);
        const fade = spawning ? Math.min(1, progress * 3) : 1 - progress;
        this.helper.scale.set((spawning ? 0.55 : 0.8 + random * 2.6) * fade, (spawning ? 0.18 : 0.16 + random * 0.28) * fade, 1);
        this.helper.updateMatrix(); this.sparks.setMatrixAt(sparkCount, this.helper.matrix);
        if (spawning) this.tint.setHSL(0.48 + random * 0.1, 0.75, 0.5 + fade * 0.25);
        else this.tint.setHSL(0.015 + random * 0.11, 0.88, 0.42 + fade * 0.34);
        this.tint.multiplyScalar(fade * (reduced ? 0.5 : 1.4));
        this.sparks.setColorAt(sparkCount++, this.tint);
      }
      if (!impact && !spawning) for (let i = 0; i < (reduced ? 4 : 18) && debrisCount < 128; i++) {
        const random = noise(event.id * 2654435761 + i * 1597334677);
        const angle = noise(event.id * 40503 + i * 7919) * Math.PI * 2, speed = (30 + random * 70) * scale;
        this.helper.position.set(x + Math.cos(angle) * speed * age, event.y + Math.sin(angle) * speed * age - 8 * age * age, 13);
        this.helper.rotation.set(age * (i + 2), age * 2, angle + age * 5);
        this.helper.scale.setScalar((0.45 + random * 0.8) * Math.max(0, 1 - age / duration));
        this.helper.updateMatrix(); this.debris.setMatrixAt(debrisCount, this.helper.matrix);
        this.tint.set(random > 0.6 ? 0xffbb77 : 0x8bafb5); this.debris.setColorAt(debrisCount++, this.tint);
      }
    }
    this.sparks.count = sparkCount; this.debris.count = debrisCount; this.clouds.count = cloudCount;
    this.count = sparkCount + debrisCount + cloudCount;
    for (const pool of [this.sparks, this.debris, this.clouds]) { pool.instanceMatrix.needsUpdate = true; pool.instanceColor!.needsUpdate = true; }
  }
}
