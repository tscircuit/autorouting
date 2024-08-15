import type { Point } from "./types"

export const manDist = (a: Point, b: Point): number => {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y)
}

export const dist = (a: Point, b: Point): number => {
  return ((a.x - b.x) ** 2 + (a.y - b.y) ** 2) ** 0.5
}

export const nodeName = (node: Point, GRID_STEP: number = 0.1): string =>
  `${Math.round(node.x / GRID_STEP)},${Math.round(node.y / GRID_STEP)}`
