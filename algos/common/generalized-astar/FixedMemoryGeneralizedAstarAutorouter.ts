import type { IGeneralizedAstarAutorouter } from "./IGeneralizedAstarAutorouter"
import type { Node, Point, PointWithObstacleHit } from "./types"

/**
 * This is a version of GeneralizedAstarAutorouter that has completely fixed
 * memory. Conceptually it is a precursor to a C implementation.
 */
export class FixedMemoryGeneralizedAstar
  implements IGeneralizedAstarAutorouter
{
  computeG(current: Node, neighbor: Point): number {
    throw new Error("computeG needs override")
  }
  computeH(node: Point): number {
    throw new Error("computeH needs override")
  }
  getNeighbors(node: Node): Array<PointWithObstacleHit> {
    throw new Error("getNeighbors needs override")
  }
}
