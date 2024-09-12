import type { Point, Direction } from "./types"

export function dirFromAToB(nodeA: Point, nodeB: Point): Direction {
  const dx = nodeB.x > nodeA.x ? 1 : nodeB.x < nodeA.x ? -1 : 0
  const dy = nodeB.y > nodeA.y ? 1 : nodeB.y < nodeA.y ? -1 : 0
  const dl = nodeB.l > nodeA.l ? 1 : nodeB.l < nodeA.l ? -1 : 0
  return { dx, dy, dl }
}

export function manDist(a: Point, b: Point): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y) + Math.abs(a.l - b.l)
}
