import type { SimpleRouteJson, SimplifiedPcbTrace } from "autorouting-dataset"
import { GeneralizedAstarAutorouter } from "../infinite-grid-ijump-astar/v2/lib/GeneralizedAstar"
import type { Node, Point } from "../infinite-grid-ijump-astar/v2/lib/types"

export class InfgridAutorouter extends GeneralizedAstarAutorouter {
  getNeighbors(node: Node): Array<Point> {
    const dirs = [
      { x: 0, y: this.GRID_STEP },
      { x: this.GRID_STEP, y: 0 },
      { x: 0, y: -this.GRID_STEP },
      { x: -this.GRID_STEP, y: 0 },
    ]

    return dirs
      .filter(
        (dir) => !this.obstacles!.isObstacleAt(node.x + dir.x, node.y + dir.y),
      )
      .map((dir) => ({
        x: node.x + dir.x,
        y: node.y + dir.y,
      }))
  }
}
