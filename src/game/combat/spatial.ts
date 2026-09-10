import { signedWrappedDeltaX } from '../../core/WorldWrap';
import { CONFIG } from '../config';

export const deltaX = (a: number, b: number): number => signedWrappedDeltaX(a, b, CONFIG.worldWidth);
export function distance(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.hypot(deltaX(a.x, b.x), b.y - a.y);
}

/** Circle versus a swept segment, relative to its start across the world seam. */
export function sweptHit(x: number, y: number, dx: number, dy: number, target: { x: number; y: number }, radius: number): number | null {
  const tx = deltaX(x, target.x), ty = target.y - y;
  const length2 = dx * dx + dy * dy;
  const t = length2 ? Math.max(0, Math.min(1, (tx * dx + ty * dy) / length2)) : 0;
  return Math.hypot(tx - t * dx, ty - t * dy) <= radius ? t : null;
}
