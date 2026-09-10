import { BoxGeometry, ConeGeometry, CylinderGeometry, Group, Mesh, OctahedronGeometry, SphereGeometry, TorusGeometry } from 'three/webgpu';
import type { Material } from 'three/webgpu';
import type { EnemyKind } from '../../game/combat/types';
import { emission, metal } from '../materials';

function box(group: Group, size: [number, number, number], position: [number, number, number], material: Material): Mesh {
  const mesh = new Mesh(new BoxGeometry(...size), material); mesh.position.set(...position); group.add(mesh); return mesh;
}

export function colonistModel(): Group {
  const group = new Group(), suit = metal(0xdde2c9, 0.75, 0.1), visor = emission(0x91ffdf);
  const head = new Mesh(new SphereGeometry(0.55, 8, 6), suit); head.position.y = 1.3; group.add(head);
  box(group, [0.72, 1.25, 0.6], [0, 0.18, 0], suit);
  box(group, [0.7, 0.2, 0.18], [0, 1.33, 0.5], visor);
  for (const x of [-0.32, 0.32]) {
    const leg = box(group, [0.28, 0.95, 0.32], [x, -0.85, 0], suit); leg.name = x < 0 ? 'leg-left' : 'leg-right';
    const arm = box(group, [0.23, 0.95, 0.3], [x * 2, 0.2, 0], suit); arm.rotation.z = x;
  }
  const beacon = new Mesh(new TorusGeometry(1.3, 0.06, 4, 16), visor); beacon.name = 'beacon';
  beacon.position.z = -0.4; group.add(beacon); return group;
}

export function enemyModel(kind: EnemyKind): Group {
  const group = new Group(), armor = metal(0x29313e, 0.47, 0.76), plates = metal(0x665767, 0.42, 0.7);
  const hot = emission(kind === 'flux' ? 0xc181ff : kind === 'wraith' ? 0xff4e94 : 0xff8877);
  if (kind === 'harvester' || kind === 'wraith') {
    const body = new Mesh(new OctahedronGeometry(2.6, 0), armor); body.scale.set(1.25, 0.7, 0.65); group.add(body);
    const eye = new Mesh(new SphereGeometry(0.75, 10, 8), hot); eye.position.z = 1.5; group.add(eye);
    for (const x of [-1, 1]) {
      const claw = box(group, [0.75, 3.5, 1.1], [x * 2.6, -1.4, 0], plates);
      claw.rotation.z = x * (kind === 'wraith' ? -0.7 : -0.2);
      const tip = new Mesh(new ConeGeometry(0.6, 2, 4), hot); tip.position.set(x * 2.15, -3.4, 0); tip.rotation.z = Math.PI; group.add(tip);
    }
    if (kind === 'wraith') {
      const crest = new Mesh(new ConeGeometry(1, 3, 4), plates); crest.position.y = 2.7; group.add(crest);
    }
  } else if (kind === 'interceptor') {
    const body = new Mesh(new ConeGeometry(1.8, 7.5, 4), armor); body.rotation.z = -Math.PI / 2; group.add(body);
    for (const y of [-1.3, 1.3]) {
      const wing = box(group, [4.2, 0.35, 1.5], [-0.5, y, 0], plates); wing.rotation.z = -Math.sign(y) * 0.4;
      box(group, [1.4, 0.16, 0.25], [0, y, 0.9], hot);
    }
    box(group, [0.5, 1.2, 0.5], [-3.7, 0, 0], hot);
  } else if (kind === 'flux') {
    const core = new Mesh(new SphereGeometry(2, 12, 8), hot); group.add(core);
    const ring = new Mesh(new TorusGeometry(3.8, 0.55, 6, 16), armor); ring.rotation.x = 0.3; group.add(ring);
    for (const x of [-4.2, 4.2]) box(group, [1.3, 5.8, 1.6], [x, 0, 0], plates);
    const axis = new Mesh(new CylinderGeometry(0.45, 0.45, 8, 6), plates); group.add(axis);
  } else if (kind === 'crossfire') {
    // A horizontal, twin-core gunship makes its vertical paired barrage legible.
    const body = new Mesh(new BoxGeometry(7, 1.45, 1.8), armor); group.add(body);
    const core = new Mesh(new CylinderGeometry(0.75, 0.75, 2.25, 8), hot); core.rotation.z = Math.PI / 2; group.add(core);
    for (const x of [-2.5, 2.5]) {
      box(group, [1.1, 3.7, 1.1], [x, 0, 0], plates);
      const turret = new Mesh(new SphereGeometry(0.46, 8, 6), hot); turret.position.set(x, 2.05, 0); group.add(turret);
      const lowerTurret = turret.clone(); lowerTurret.position.y = -2.05; group.add(lowerTurret);
    }
  } else {
    const core = new Mesh(new OctahedronGeometry(1.4, 0), hot); group.add(core);
    box(group, [3.2, 0.25, 0.5], [0, 0, 0], armor);
  }
  return group;
}
