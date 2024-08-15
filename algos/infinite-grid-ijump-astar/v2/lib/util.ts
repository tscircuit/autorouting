import type { Point } from "./types"

export const manDist = (a: Point, b: Point): number => {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y)
}

export const dist = (a: Point, b: Point): number => {
  return ((a.x - b.x) ** 2 + (a.y - b.y) ** 2) ** 0.5
}

export interface Node extends Point {
  /** Distance from the parent node (along path) */
  g: number
  /** Heuristic distance from the goal */
  h: number
  /** Distance score for this node (g + h) */
  f: number
  /** Manhattan Distance from the parent node */
  manDistFromParent: number
  nodesInPath: number
  parent: Node | null
}
