import type { SimpleRouteJson, SimplifiedPcbTrace } from "autorouting-dataset"
import { GeneralizedAstarAutorouter } from "./GeneralizedAstar"
import type {
  Direction,
  DirectionWithCollisionInfo,
  DirectionWithWallDistance,
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

  getNeighbors(node: Node): Array<PointWithObstacleHit> {
    const obstacles = this.obstacles!
    const goalPoint = this.goalPoint!

    /**
     * This is considered "forward" if we were to continue from the parent,
     * through the current node.
     */
    let forwardDir: Direction
    if (!node.parent) {
      forwardDir = dirFromAToB(node, goalPoint)
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
      // Filter out directions that are too close to the wall
      .filter((dir) => dir.wallDistance >= this.OBSTACLE_MARGIN)

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
          SHOULD_DETECT_CONJOINED_OBSTACLES: true,
        })
      }

      const goalDistAlongTravelDir = distAlongDir(node, goalPoint, travelDir)
      const isGoalInTravelDir =
        (travelDir.dx === 0 ||
          Math.sign(goalPoint.x - node.x) === travelDir.dx) &&
        (travelDir.dy === 0 || Math.sign(goalPoint.y - node.y) === travelDir.dy)

      if (
        goalDistAlongTravelDir < travelDir.wallDistance &&
        goalDistAlongTravelDir > 0 &&
        isGoalInTravelDir
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
          travelDistance: travelDir.wallDistance - this.OBSTACLE_MARGIN,
        })
      }
    }

    return (
      travelDirs2
        // If an obstacle fails this check, we messed up computing neighbors
        // Currently this happens when we overcome obstacles and there's a
        // different obstacle in the travel direction
        .filter((dir) => {
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
    )
  }
}
