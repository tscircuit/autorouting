import type { SimpleRouteJson, SimplifiedPcbTrace } from "autorouting-dataset"
import { GeneralizedAstarAutorouter } from "./GeneralizedAstar"
import type { Node, Point, PointWithDistance } from "./types"
import { clamp, dirFromAToB, dist } from "./util"
import { getDistanceToOvercomeObstacle } from "./getDistanceToOvercomeObstacle"
import { distance } from "@tscircuit/soup"

export class IJumpAutorouter extends GeneralizedAstarAutorouter {
  MAX_ITERATIONS: number = 2
  /**
   * Find the optimal neighbor for a given direction
   *
   * The optimal neighbor is the next neighbor that enables travel along the
   * primary direction.
   *
   * If you can't find a neighbor before hitting a wall (given by wallDistance)
   * return null
   */
  getNeighborForDirection({
    node,
    travelDir,
    wallDistance,
    primaryDir,
  }: {
    node: Node
    travelDir: PointWithDistance
    wallDistance: number
    primaryDir: PointWithDistance
  }): Point | null {
    const obstacles = this.obstacles!

    const dist = getDistanceToOvercomeObstacle({
      node,
      travelDir,
      primaryDir,
      obstacle: node.obstacleHit!,
      obstacles,
      OBSTACLE_MARGIN: 0.15,
      SHOULD_DETECT_CONJOINED_OBSTACLES: false,
      MAX_CONJOINED_OBSTACLES: 10, // You may need to adjust this value
      obstaclesInRow: 0, // You may need to calculate this value
    })

    return {
      x: node.x + travelDir.x * dist,
      y: node.y + travelDir.y * dist,
    }
  }

  getNeighbors(node: Node): Array<Point> {
    const obstacles = this.obstacles!

    /**
     * This is considered "forward" if we were to continue from the parent,
     * through the current node.
     */
    let forwardDir: Point
    if (!node.parent) {
    } else {
      forwardDir = dirFromAToB(node.parent, node)
    }

    const distances = obstacles.getDirectionDistancesToNearestObstacle(
      node.x,
      node.y,
    )

    const dirs = [
      { x: 0, y: 1, distance: distances.top },
      { x: 1, y: 0, distance: distances.right },
      { x: 0, y: -1, distance: distances.bottom },
      { x: -1, y: 0, distance: distances.left },
    ]

    return dirs
      .map((dir) => ({
        ...dir,
        stepSize: clamp(this.GRID_STEP, 1, dir.distance - this.GRID_STEP),
      }))
      .filter((dir) => {
        return !obstacles.isObstacleAt(
          node.x + dir.x * dir.stepSize,
          node.y + dir.y * dir.stepSize,
        )
      })
      .map((dir) => ({
        x: node.x + dir.x * dir.stepSize,
        y: node.y + dir.y * dir.stepSize,
      }))
  }
}
