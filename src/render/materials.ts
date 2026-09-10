import { Color, DoubleSide, MeshBasicNodeMaterial, MeshStandardNodeMaterial } from 'three/webgpu';
import { color, cos, float, mix, mx_noise_float, positionLocal, sin, smoothstep, time, uniform, uv, vec3 } from 'three/tsl';

export function metal(hex: number, roughness = 0.6, metalness = 0.5): MeshStandardNodeMaterial {
  return new MeshStandardNodeMaterial({ color: hex, roughness, metalness });
}

export function emission(hex: number, intensity = 1): MeshBasicNodeMaterial {
  return new MeshBasicNodeMaterial({ color: new Color(hex).multiplyScalar(intensity), toneMapped: false });
}

export function engineMaterial() {
  const thrust = uniform(0.25);
  const material = new MeshBasicNodeMaterial({ transparent: true, depthWrite: false, side: DoubleSide, toneMapped: false });
  const cross = uv().y.sub(0.5).abs().mul(2);
  const lengthFade = float(1).sub(uv().x).pow(0.7);
  const edge = float(1).sub(smoothstep(0.15, 1, cross));
  material.colorNode = mix(color('#2375a3'), color('#c6fff3'), edge.pow(2));
  material.opacityNode = edge.mul(lengthFade).mul(thrust);
  return { material, thrust };
}

export function skyMaterial(): MeshBasicNodeMaterial {
  const material = new MeshBasicNodeMaterial({ depthWrite: false });
  const horizon = float(1).sub(uv().y).pow(3);
  const ribbon = sin(uv().x.mul(8).add(uv().y.mul(5))).mul(0.5).add(0.5);
  material.colorNode = mix(color('#020509'), color('#19303b'), horizon)
    .add(color('#152c38').mul(ribbon.pow(5)).mul(0.18));
  return material;
}

export function beaconMaterial(): MeshBasicNodeMaterial {
  const material = emission(0x9ff8df);
  material.colorNode = color('#9ff8df').mul(sin(time.mul(1.8)).mul(0.12).add(0.88));
  return material;
}

export function planetMaterial(): MeshStandardNodeMaterial {
  const material = metal(0x647778, 1, 0);
  const continental = mx_noise_float(positionLocal.mul(0.15)).mul(0.5).add(0.5);
  const detail = mx_noise_float(positionLocal.mul(1.5)).mul(0.13);
  const bands = sin(positionLocal.y.mul(0.7).add(continental.mul(9))).mul(0.06);
  material.colorNode = mix(color('#233c48'), color('#79908e'), smoothstep(0.28, 0.73, continental.add(detail).add(bands)));
  material.roughnessNode = float(0.95);
  return material;
}

export function basaltMaterial(): MeshStandardNodeMaterial {
  const material = metal(0x344249, 0.98, 0.12);
  const angle = positionLocal.x.mul(Math.PI * 2 / 2400);
  const surface = vec3(sin(angle).mul(90), positionLocal.y.mul(0.7), cos(angle).mul(90));
  const coarse = mx_noise_float(surface).mul(0.4);
  const grain = mx_noise_float(surface.mul(9)).mul(0.12);
  material.colorNode = mix(color('#122229'), color('#485658'), coarse.add(grain).add(0.4));
  return material;
}
