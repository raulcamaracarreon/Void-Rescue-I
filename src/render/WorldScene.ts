import {
  BoxGeometry, BufferGeometry, Color, CylinderGeometry, Float32BufferAttribute,
  Group, InstancedMesh, Mesh, Object3D, PlaneGeometry, SphereGeometry,
} from 'three/webgpu';
import { Random } from '../core/Random';
import { CONFIG, SETTLEMENTS } from '../game/config';
import { Terrain } from '../game/Terrain';
import { nearCameraX } from '../core/WorldWrap';
import { basaltMaterial, beaconMaterial, emission, metal, planetMaterial, skyMaterial } from './materials';

function makeRidge(seed: number, depth: number, distant: boolean): Mesh {
  const terrain = new Terrain(seed);
  const vertices: number[] = [], indices: number[] = [];
  const step = distant ? 8 : 2;
  for (let x = 0; x <= CONFIG.worldWidth; x += step) {
    const height = distant ? terrain.height(x) * 2.9 - 8 : terrain.height(x);
    // A slanted upper ledge and faceted front face give the basalt depth.
    vertices.push(x, height, depth - 8, x, height - (distant ? 0 : 2.5), depth, x, -28, depth + 3);
    if (x > 0) {
      const i = (x / step - 1) * 3;
      indices.push(i, i + 1, i + 3, i + 1, i + 4, i + 3, i + 1, i + 2, i + 4, i + 2, i + 5, i + 4);
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  // End vertices have only one neighbor until the tile repeats. Share their
  // averaged normals so lighting is continuous as well as position and slope.
  const normals = geometry.getAttribute('normal');
  for (let first = 0; first < 3; first++) {
    const last = normals.count - 3 + first;
    const x = normals.getX(first) + normals.getX(last);
    const y = normals.getY(first) + normals.getY(last);
    const z = normals.getZ(first) + normals.getZ(last);
    const length = Math.hypot(x, y, z) || 1;
    normals.setXYZ(first, x / length, y / length, z / length);
    normals.setXYZ(last, x / length, y / length, z / length);
  }
  const material = distant ? metal(0x152c36, 0.98, 0.12) : basaltMaterial();
  if (distant) { material.emissive.setHex(0x10202a); material.emissiveIntensity = 0.3; }
  return new Mesh(geometry, material);
}

function createSettlement(x: number, terrain: Terrain, random: Random): Group {
  const group = new Group();
  group.position.set(x, terrain.height(x) - 0.4, -8);
  const steel = metal(0x7d9290, 0.72, 0.5), dark = metal(0x23343a, 0.82, 0.4);
  const amber = emission(0xe4b977, 0.75), cyan = beaconMaterial();
  const deck = new Mesh(new BoxGeometry(23, 1, 8), dark);
  deck.position.y = 0.5;
  group.add(deck);
  for (let i = 0; i < 5; i++) {
    const width = random.range(2, 3.6), height = random.range(1.6, 4.5);
    const building = new Mesh(new BoxGeometry(width, height, 3.5), steel);
    building.position.set(i * 4.1 - 8.2, height / 2 + 1, 0);
    group.add(building);
    const roof = new Mesh(new BoxGeometry(width + 0.3, 0.22, 3.7), dark);
    roof.position.copy(building.position); roof.position.y += height / 2;
    group.add(roof);
    const window = new Mesh(new BoxGeometry(width * 0.6, 0.24, 0.08), amber);
    window.position.set(building.position.x, height * 0.65 + 1, 1.8);
    group.add(window);
  }
  const mast = new Mesh(new CylinderGeometry(0.1, 0.16, 10, 5), steel);
  mast.position.set(6, 7.2, -1);
  group.add(mast);
  const bar = new Mesh(new BoxGeometry(3.5, 0.15, 0.18), steel);
  bar.position.set(6, 10.5, -1); group.add(bar);
  const beacon = new Mesh(new SphereGeometry(0.3, 8, 6), cyan);
  beacon.position.set(6, 12.3, -1); group.add(beacon);
  for (const offset of [-11, 11]) {
    const light = new Mesh(new BoxGeometry(0.4, 0.3, 0.4), cyan);
    light.position.set(offset, 1.2, 3.6); group.add(light);
  }
  return group;
}

export class WorldScene {
  readonly group = new Group();
  readonly backdrop = new Group();
  private readonly terrainCopies: Group[] = [];
  private readonly settlements: Group[] = [];
  private readonly stars: InstancedMesh;
  private readonly starPositions: { x: number; y: number; z: number; size: number }[] = [];
  private readonly matrix = new Object3D();
  private readonly sky: Mesh;
  private readonly moon = new Group();

  constructor(seed: number) {
    const random = new Random(seed ^ 0x71a4);
    const terrain = new Terrain(seed);
    this.sky = new Mesh(new PlaneGeometry(1, 1), skyMaterial());
    this.sky.position.set(0, 52, -170);
    this.backdrop.add(this.sky);

    const planet = new Mesh(new SphereGeometry(27, 64, 48), planetMaterial());
    planet.scale.y = 0.96;
    this.moon.add(planet);
    const ring = new Mesh(new SphereGeometry(27.15, 48, 32), emission(0x557e8d));
    ring.material.transparent = true;
    ring.material.opacity = 0.045;
    ring.material.depthWrite = false;
    this.moon.add(ring);
    this.moon.position.set(42, 99, -125);
    this.backdrop.add(this.moon);

    this.stars = new InstancedMesh(new PlaneGeometry(1, 1), emission(0xb8cfdb), 620);
    for (let i = 0; i < this.stars.count; i++) {
      this.starPositions.push({ x: random.range(-165, 165), y: random.range(18, 140), z: random.range(-150, -130), size: random.range(0.05, 0.23) });
      this.stars.setColorAt(i, new Color().setRGB(random.range(0.3, 0.9), random.range(0.5, 1), random.range(0.65, 1)));
    }
    this.stars.frustumCulled = false;
    this.backdrop.add(this.stars);

    const mainRidge = makeRidge(seed, 8, false);
    const farRidge = makeRidge(seed ^ 225, -55, true);
    const midRidge = makeRidge(seed ^ 874, -25, true);
    midRidge.scale.y = 0.6;
    // Share geometry and materials across the three neighboring world images.
    for (let copy = -1; copy <= 1; copy++) {
      const tile = new Group();
      tile.add(mainRidge.clone(), farRidge.clone(), midRidge.clone());
      this.terrainCopies.push(tile);
      this.group.add(tile);
    }

    for (const settlement of SETTLEMENTS) {
      const model = createSettlement(settlement.x, terrain, random);
      model.userData.worldX = settlement.x;
      this.settlements.push(model);
      this.group.add(model);
    }
  }

  update(cameraX: number, viewWidth: number): void {
    this.backdrop.position.x = cameraX;
    this.sky.scale.set(viewWidth + 5, 140, 1);
    this.moon.position.x = viewWidth * 0.24 - Math.sin(cameraX / CONFIG.worldWidth * Math.PI * 2) * 4;
    const tileIndex = Math.floor(cameraX / CONFIG.worldWidth);
    this.terrainCopies.forEach((tile, index) => { tile.position.x = (tileIndex + index - 1) * CONFIG.worldWidth; });
    this.settlements.forEach(model => { model.position.x = nearCameraX(model.userData.worldX as number, cameraX, CONFIG.worldWidth); });
    this.starPositions.forEach((star, i) => {
      this.matrix.position.set(((star.x - cameraX * 0.035 + 165) % 330 + 330) % 330 - 165, star.y, star.z);
      this.matrix.scale.setScalar(star.size);
      this.matrix.updateMatrix();
      this.stars.setMatrixAt(i, this.matrix.matrix);
    });
    this.stars.instanceMatrix.needsUpdate = true;
  }
}
