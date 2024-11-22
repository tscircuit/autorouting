import type { Node, Point, PointWithObstacleHit } from "./types"

export interface IGeneralizedAstarAutorouter {
  computeG(current: Node, neighbor: Point): number
  computeH(node: Point): number
  getNeighbors(node: Node): Array<PointWithObstacleHit>
}
