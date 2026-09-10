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
export class DestructionEffects {
  readonly group = new Group();
  private readonly sparks = new InstancedMesh(new PlaneGeometry(1, 1), glow(), 768);
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
      if (age < 0 || age > 1.5 || !['impact', 'explosion', 'player-hit', 'bomb'].includes(event.kind)) continue;
      const x = nearCameraX(event.x, cameraX, CONFIG.worldWidth);
      if (Math.abs(x - cameraX) > width / 2 + 45) continue;
      const impact = event.kind === 'impact', large = event.kind === 'bomb' || event.kind === 'player-hit';
      const scale = impact ? 0.35 : large ? 1.4 : 1;
      if (age < 0.3 && flashCount < this.flashes.length) {
        const flash = this.flashes[flashCount++]!;
        flash.visible = true; flash.position.set(x, event.y, 14);
        flash.scale.setScalar((5 + age * 35) * scale);
        flash.material.color.set(0xffd19a); flash.material.opacity = (1 - age / 0.3) * (reduced ? 0.2 : 0.9);
      }
      const amount = reduced ? 8 : impact ? 20 : large ? 110 : 70;
      for (let i = 0; i < amount && sparkCount < 768; i++) {
        const random = ((Math.imul(event.id + i * 31, 16807) >>> 0) % 997) / 997;
        const angle = i * 2.39996 + event.id * 0.51;
        const speed = (12 + random * 38) * scale;
        const lifetime = 0.45 + random * 0.8;
        if (age > lifetime) continue;
        const travel = speed * (1 - Math.exp(-age * 1.7)) / 1.7;
        this.helper.position.set(x + Math.cos(angle) * travel, event.y + Math.sin(angle) * travel - age * age * 4, 14);
        this.helper.rotation.set(0, 0, angle);
        const fade = 1 - age / lifetime;
        this.helper.scale.set((1.5 + random * 3) * fade, (0.25 + random * 0.25) * fade, 1);
        this.helper.updateMatrix(); this.sparks.setMatrixAt(sparkCount, this.helper.matrix);
        this.tint.setHSL(0.025 + random * 0.09, 0.8, 0.45 + fade * 0.3).multiplyScalar(fade * (reduced ? 0.5 : 1.4));
        this.sparks.setColorAt(sparkCount++, this.tint);
      }
      if (!impact) for (let i = 0; i < (reduced ? 3 : 12) && debrisCount < 128; i++) {
        const angle = i * 2.4 + event.id, speed = (7 + i * 1.6) * scale;
        this.helper.position.set(x + Math.cos(angle) * speed * age, event.y + Math.sin(angle) * speed * age - 8 * age * age, 13);
        this.helper.rotation.set(age * (i + 2), age * 2, angle + age * 5);
        this.helper.scale.setScalar((i % 3 ? 0.7 : 1.3) * Math.max(0, 1 - age / 1.5));
        this.helper.updateMatrix(); this.debris.setMatrixAt(debrisCount, this.helper.matrix);
        this.tint.set(i % 3 ? 0x8bafb5 : 0xffbb77); this.debris.setColorAt(debrisCount++, this.tint);
      }
      if (!impact && !reduced) for (let i = 0; i < 5 && cloudCount < 96; i++) {
        const angle = i * 1.256 + event.id;
        this.helper.position.set(x + Math.cos(angle) * age * 8, event.y + Math.sin(angle) * age * 6 + age * 3, 12.5);
        this.helper.rotation.set(0, 0, 0); this.helper.scale.setScalar((5 + age * 17) * scale);
        this.helper.updateMatrix(); this.clouds.setMatrixAt(cloudCount, this.helper.matrix);
        this.tint.set(0xee5421).multiplyScalar(Math.max(0, 1 - age / 1.5) * 0.24);
        this.clouds.setColorAt(cloudCount++, this.tint);
      }
    }
    this.sparks.count = sparkCount; this.debris.count = debrisCount; this.clouds.count = cloudCount;
    this.count = sparkCount + debrisCount + cloudCount;
    for (const pool of [this.sparks, this.debris, this.clouds]) { pool.instanceMatrix.needsUpdate = true; pool.instanceColor!.needsUpdate = true; }
  }
}
