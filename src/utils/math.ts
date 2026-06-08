


export const GRID_STEPS = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000] as const


export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}


export function getGridStep(scale: number): number {
  const targetPixels = 80
  const targetUnits = targetPixels / scale

  for (const step of GRID_STEPS) {
    if (step >= targetUnits) {
      return step
    }
  }

  return GRID_STEPS[GRID_STEPS.length - 1]
}
