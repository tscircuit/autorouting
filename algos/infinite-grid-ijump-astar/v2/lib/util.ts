import type { Direction, Point } from "./types"

export const clamp = (min: number, max: number, value: number) => {
  return Math.min(Math.max(min, value), max)
}

export const manDist = (a: Point, b: Point): number => {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y)
}

export const dist = (a: Point, b: Point): number => {
  return ((a.x - b.x) ** 2 + (a.y - b.y) ** 2) ** 0.5
}

export const dirFromAToB = (a: Point, b: Point): { dx: number; dy: number } => {
  const dx = b.x - a.x
  const dy = b.y - a.y

  if (Math.abs(dx) > Math.abs(dy)) {
    return { dx: Math.sign(dx), dy: 0 }
  } else {
    return { dx: 0, dy: Math.sign(dy) }
  }
}

export const distAlongDir = (A: Point, B: Point, dir: Direction): number => {
  return Math.abs((A.x - B.x) * dir.dx) + Math.abs((A.y - B.y) * dir.dy)
}

export const nodeName = (node: Point, GRID_STEP: number = 0.1): string =>
  `${Math.round(node.x / GRID_STEP)},${Math.round(node.y / GRID_STEP)}`
