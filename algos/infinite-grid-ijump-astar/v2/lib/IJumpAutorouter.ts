import type { SimpleRouteJson, SimplifiedPcbTrace } from "autorouting-dataset"
import { GeneralizedAstarAutorouter } from "./GeneralizedAstar"
import type {
  Direction,
  DirectionWithCollisionInfo,
  Node,
  Point,
  PointWithWallDistance,
} from "./types"
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
    travelDir: PointWithWallDistance
    wallDistance: number
    primaryDir: PointWithWallDistance
  }): Point | null {
    const obstacles = this.obstacles!

    const dist = getDistanceToOvercomeObstacle({
      node,
      travelDir,
      wallDir: primaryDir,
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
    let forwardDir: Direction
    if (!node.parent) {
      forwardDir = dirFromAToB(node, this.goalPoint!)
    } else {
      forwardDir = dirFromAToB(node.parent, node)
    }

    /**
     * All four directions and the distance to the nearest wall
     */
    const travelDirs1 = [
      { dx: 0, dy: 1 },
      { dx: 1, dy: 0 },
      { dx: 0, dy: -1 },
      { dx: -1, dy: 0 },
    ]
      .filter((dir) => {
        // If we have a parent, don't go backwards towards the parent
        if (dir.dx === forwardDir.dx * -1 && dir.dy === forwardDir.dy * -1) {
          return false
        }
        return true
      })
      .map((dir) => obstacles.getOrthoDirectionCollisionInfo(node, dir))

    console.log(travelDirs1)

    /**
     * Figure out how far to travel
     */
    const travelDirs2: Array<
      DirectionWithCollisionInfo & { travelDistance: number }
    > = []
    for (const travelDir of travelDirs1) {
      // const travelDistance = getDistanceToOvercomeObstacle({
      //   node,
      //   travelDir,
      //   wallDir: { ...forwardDir, wallDistance: this.GRID_STEP },
      //   obstacle: ,
      //   obstacles,
      //   OBSTACLE_MARGIN: 0.15,
      //   SHOULD_DETECT_CONJOINED_OBSTACLES: false,
      //   MAX_CONJOINED_OBSTACLES: 10, // You may need to adjust this value
      //   obstaclesInRow: 0, // You may need to calculate this value
      // })
      // console.log({ travelDir, travelDistance })
    }

    return travelDirs1
      .map((dir) => ({
        ...dir,
        stepSize: clamp(
          this.GRID_STEP,
          1,
          dir.wallDistance - this.OBSTACLE_MARGIN,
        ),
      }))
      .filter((dir) => {
        console.log({
          dir,
          isObstacleAtPoint: obstacles.isObstacleAt(
            node.x + dir.dx * dir.stepSize,
            node.y + dir.dy * dir.stepSize,
          ),
        })
        return !obstacles.isObstacleAt(
          node.x + dir.dx * dir.stepSize,
          node.y + dir.dy * dir.stepSize,
        )
      })
      .map((dir) => ({
        x: node.x + dir.dx * dir.stepSize,
        y: node.y + dir.dy * dir.stepSize,
      }))
  }
}
