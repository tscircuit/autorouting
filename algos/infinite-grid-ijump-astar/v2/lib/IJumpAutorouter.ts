import type { SimpleRouteJson, SimplifiedPcbTrace } from "autorouting-dataset"
import { GeneralizedAstarAutorouter } from "./GeneralizedAstar"
import type {
  Direction,
  DirectionWithCollisionInfo,
  Node,
  Point,
  PointWithObstacleHit,
  PointWithWallDistance,
} from "./types"
import { clamp, dirFromAToB, dist, distAlongDir } from "./util"
import { getDistanceToOvercomeObstacle } from "./getDistanceToOvercomeObstacle"
import { distance } from "@tscircuit/soup"

export class IJumpAutorouter extends GeneralizedAstarAutorouter {
  MAX_ITERATIONS: number = 200
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

  getNeighbors(node: Node): Array<PointWithObstacleHit> {
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
     * Get the 2-3 next directions (excluding backwards direction), and
     * excluding the forward direction if we just ran into a wall
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
        } else if (
          dir.dx === forwardDir.dx &&
          dir.dy === forwardDir.dy &&
          node.parent?.obstacleHit
        ) {
          return false
        }
        return true
      })
      .map((dir) => obstacles.getOrthoDirectionCollisionInfo(node, dir))

    /**
     * Figure out how far to travel. There are a couple reasons we would stop
     * traveling:
     * - A different direction opened up while we were traveling (the obstacle
     *   our parent hit was overcome)
     * - We hit a wall
     * - We passed the goal along the travel direction
     */
    const travelDirs2: Array<
      DirectionWithCollisionInfo & { travelDistance: number }
    > = []
    for (const travelDir of travelDirs1) {
      let overcomeDistance: number | null = null
      if (node?.obstacleHit) {
        overcomeDistance = getDistanceToOvercomeObstacle({
          node,
          travelDir,
          wallDir: { ...forwardDir, wallDistance: this.OBSTACLE_MARGIN },
          obstacle: node.obstacleHit,
          obstacles,
          OBSTACLE_MARGIN: 0.15,
          SHOULD_DETECT_CONJOINED_OBSTACLES: false,
          MAX_CONJOINED_OBSTACLES: 10, // You may need to adjust this value
          obstaclesInRow: 0, // You may need to calculate this value
        })
      }

      const goalDistAlongTravelDir = distAlongDir(
        node,
        this.goalPoint!,
        travelDir,
      )

      if (
        goalDistAlongTravelDir < travelDir.wallDistance &&
        goalDistAlongTravelDir > 0
      ) {
        travelDirs2.push({
          ...travelDir,
          travelDistance: goalDistAlongTravelDir,
        })
      } else if (
        overcomeDistance !== null &&
        overcomeDistance < travelDir.wallDistance
      ) {
        travelDirs2.push({
          ...travelDir,
          travelDistance: overcomeDistance,
        })
      } else if (travelDir.wallDistance !== Infinity) {
        travelDirs2.push({
          ...travelDir,
          travelDistance: clamp(
            this.GRID_STEP,
            1,
            travelDir.wallDistance - this.OBSTACLE_MARGIN,
          ),
        })
      }

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

    // console.log(travelDirs2)

    return travelDirs2
      .map((dir) => ({
        ...dir,
        // stepSize: clamp(
        //   this.GRID_STEP,
        //   1,
        //   dir.wallDistance - this.OBSTACLE_MARGIN,
        // ),
      }))
      .filter((dir) => {
        // Probably shouldn't need this check...
        return !obstacles.isObstacleAt(
          node.x + dir.dx * dir.travelDistance,
          node.y + dir.dy * dir.travelDistance,
        )
      })
      .map((dir) => ({
        x: node.x + dir.dx * dir.travelDistance,
        y: node.y + dir.dy * dir.travelDistance,
        obstacleHit: dir.obstacle,
      }))
  }
}
