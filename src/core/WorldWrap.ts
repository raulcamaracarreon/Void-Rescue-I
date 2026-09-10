export function wrapX(x: number, width: number): number {
  return ((x % width) + width) % width;
}

/** The antipodal tie always resolves to the negative direction. */
export function signedWrappedDeltaX(from: number, to: number, width: number): number {
  return wrapX(to - from + width / 2, width) - width / 2;
}

export function wrappedDistanceX(a: number, b: number, width: number): number {
  return Math.abs(signedWrappedDeltaX(a, b, width));
}

export function nearCameraX(x: number, cameraX: number, width: number): number {
  return cameraX + signedWrappedDeltaX(cameraX, x, width);
}

export function wrappedLerp(from: number, to: number, alpha: number, width: number): number {
  return wrapX(from + signedWrappedDeltaX(from, to, width) * alpha, width);
}

/** Normalized ranges for a radar view window, split at the world seam. */
export function radarSegments(center: number, span: number, width: number): [number, number][] {
  if (span >= width) return [[0, 1]];
  const start = wrapX(center - span / 2, width) / width;
  const end = start + span / width;
  return end <= 1 ? [[start, end]] : [[start, 1], [0, end - 1]];
}
