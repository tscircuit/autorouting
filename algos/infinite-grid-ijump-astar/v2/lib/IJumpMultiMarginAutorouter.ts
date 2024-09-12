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
import { clamp, dirFromAToB, dist, distAlongDir, manDist } from "./util"
import { getDistanceToOvercomeObstacle } from "./getDistanceToOvercomeObstacle"
import { distance } from "@tscircuit/soup"

export class IJumpMultiMarginAutorouter extends GeneralizedAstarAutorouter {
  MAX_ITERATIONS: number = 500

  /**
   * For a multi-margin autorouter, we penalize traveling close to the wall
   *
   * The best way to compute cost is to multiple the travelMargin cost factor by
   * the distance traveled by along the wall and add the enterMargin cost factor
   * whenever we enter a new margin
   *
   * MUST BE ORDERED FROM HIGHEST MARGIN TO LOWEST (TODO sort in constructor)
   */
  marginsWithCosts: Array<{
    margin: number
    enterCost: number
    travelCostFactor: number
  }> = [
    {
      margin: 1,
      enterCost: 0,
      travelCostFactor: 1,
    },
    // {
    //   margin: 0.25,
    //   enterCost: 5,
    //   travelCostFactor: 1.5,
    // },
    {
      margin: 0.15,
      enterCost: 10,
      travelCostFactor: 2,
    },
  ]

  get largestMargin() {
    return this.marginsWithCosts[0].margin
  }

  computeG(current: Node, neighbor: Point): number {
    return (
      current.g +
      manDist(current, neighbor) * (current.travelMarginCostFactor ?? 1) +
      ((neighbor as any).enterMarginCost ?? 0)
    )
  }

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
      .map((dir) =>
        obstacles.getOrthoDirectionCollisionInfo(node, dir, {
          margin: this.OBSTACLE_MARGIN,
        }),
      )
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
      DirectionWithCollisionInfo & {
        travelDistance: number
        travelMarginCostFactor: number
        enterMarginCost: number
      }
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
          OBSTACLE_MARGIN: this.OBSTACLE_MARGIN,
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
          enterMarginCost: 0,
          travelMarginCostFactor: 1,
        })
      } else if (
        overcomeDistance !== null &&
        overcomeDistance < travelDir.wallDistance
      ) {
        for (const { margin, enterCost, travelCostFactor } of this
          .marginsWithCosts) {
          if (
            overcomeDistance - this.OBSTACLE_MARGIN + margin * 2 <
            travelDir.wallDistance
          ) {
            travelDirs2.push({
              ...travelDir,
              travelDistance: overcomeDistance - this.OBSTACLE_MARGIN + margin,
              enterMarginCost: enterCost,
              travelMarginCostFactor: travelCostFactor,
            })
          }
        }
        if (travelDir.wallDistance === Infinity) {
          travelDirs2.push({
            ...travelDir,
            travelDistance: goalDistAlongTravelDir,
            enterMarginCost: 0,
            travelMarginCostFactor: 1,
          })
        } else if (travelDir.wallDistance > this.largestMargin) {
          for (const { margin, enterCost, travelCostFactor } of this
            .marginsWithCosts) {
            if (travelDir.wallDistance > this.largestMargin + margin) {
              travelDirs2.push({
                ...travelDir,
                travelDistance: travelDir.wallDistance - margin,
                enterMarginCost: enterCost,
                travelMarginCostFactor: travelCostFactor,
              })
            }
          }
        }
      } else if (travelDir.wallDistance !== Infinity) {
        for (const { margin, enterCost, travelCostFactor } of this
          .marginsWithCosts) {
          if (travelDir.wallDistance > margin) {
            travelDirs2.push({
              ...travelDir,
              travelDistance: travelDir.wallDistance - margin,
              enterMarginCost: enterCost,
              travelMarginCostFactor: travelCostFactor,
            })
          }
        }
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
          travelMarginCostFactor: dir.travelMarginCostFactor,
          enterMarginCost: dir.enterMarginCost,
        }))
    )
  }
}
