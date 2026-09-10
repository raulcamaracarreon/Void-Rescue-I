import { BoxGeometry, CylinderGeometry, ExtrudeGeometry, Group, Mesh, PlaneGeometry, Shape } from 'three/webgpu';
import type { Material } from 'three/webgpu';
import { emission, engineMaterial, metal } from '../materials';

function hull(points: [number, number][], depth: number, material: Material): Mesh {
  const shape = new Shape();
  shape.moveTo(...points[0]!);
  for (const point of points.slice(1)) shape.lineTo(...point);
  shape.closePath();
  const geometry = new ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelSegments: 1, steps: 1, bevelSize: 0.12, bevelThickness: 0.1 });
  geometry.translate(0, 0, -depth / 2);
  return new Mesh(geometry, material);
}

export function createShip() {
  const group = new Group();
  const ivory = metal(0xc9d1ca, 0.34, 0.58);
  const graphite = metal(0x18262b, 0.48, 0.75);
  const panel = metal(0x657a7d, 0.44, 0.65);
  const glow = emission(0xa3ffed);
  const cockpit = metal(0x184853, 0.16, 0.85);
  cockpit.emissive.setHex(0x12667a);
  cockpit.emissiveIntensity = 0.65;

  group.add(hull([[-3.8, -0.65], [-2.8, -1.12], [1.4, -0.82], [4.7, -0.08], [3.2, 0.65], [-0.6, 0.98], [-3.6, 0.64]], 1.3, ivory));
  const keel = hull([[-3.1, -0.8], [0.6, -1.18], [3.4, -0.48], [-2, -0.4]], 0.85, graphite);
  keel.position.z = 0.35;
  group.add(keel);

  const canopy = hull([[-0.1, 0.55], [0.8, 1.21], [2.1, 1.0], [3.1, 0.5]], 0.9, cockpit);
  canopy.position.z = 0.3;
  group.add(canopy);

  const rearWing = hull([[-3.8, -0.2], [-4.5, -2.15], [-2.2, -1.75], [0.5, -0.38]], 0.18, panel);
  rearWing.position.z = -0.5;
  group.add(rearWing);
  const wing = hull([[-3.3, 0.3], [-4.1, 2.3], [-2.3, 2.05], [0.7, 0.3]], 0.2, ivory);
  wing.position.z = 0.75;
  group.add(wing);

  const exhausts: Mesh[] = [];
  const engineNode = engineMaterial();
  for (const y of [-0.88, 0.92]) {
    const nacelle = new Mesh(new CylinderGeometry(0.43, 0.56, 3.1, 8), graphite);
    nacelle.rotation.z = Math.PI / 2;
    nacelle.position.set(-2.9, y, 0.72);
    group.add(nacelle);
    const collar = new Mesh(new CylinderGeometry(0.57, 0.57, 0.24, 10), panel);
    collar.rotation.z = Math.PI / 2;
    collar.position.set(-4.4, y, 0.72);
    group.add(collar);
    const outlet = new Mesh(new CylinderGeometry(0.39, 0.39, 0.08, 10), glow);
    outlet.rotation.z = Math.PI / 2;
    outlet.position.set(-4.56, y, 0.72);
    group.add(outlet);
    const plume = new Mesh(new PlaneGeometry(1, 1), engineNode.material);
    plume.rotation.z = Math.PI;
    plume.position.set(-6, y, 0.72);
    exhausts.push(plume);
    group.add(plume);
  }

  for (const x of [-2, -0.7, 0.5]) {
    const seam = new Mesh(new BoxGeometry(0.06, 1.02, 0.035), graphite);
    seam.position.set(x, 0, 0.81);
    group.add(seam);
  }
  const stripe = new Mesh(new BoxGeometry(2.7, 0.1, 0.06), glow);
  stripe.position.set(-0.25, -0.5, 0.86);
  group.add(stripe);
  const barrel = new Mesh(new CylinderGeometry(0.12, 0.16, 2.3, 8), panel);
  barrel.rotation.z = Math.PI / 2;
  barrel.position.set(3.25, -0.44, 0.75);
  group.add(barrel);
  group.rotation.x = 0.24;

  return { group, exhausts, thrust: engineNode.thrust };
}
