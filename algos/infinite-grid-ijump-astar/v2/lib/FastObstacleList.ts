import type { Obstacle } from "autorouting-dataset"
import type { DirectionDistances } from "./types"

/**
 * A list of obstacles with functions for fast lookups
 *
 * TODO: This should use a quadtree (eventually)
 */
export class FastObstacleList {
  private obstacles: Array<{
    obstacle: Obstacle
  }>
  private GRID_STEP = 0.1

  constructor(obstacles: Array<Obstacle>) {
    this.obstacles = obstacles.map((obstacle) => ({
      obstacle,
    }))
  }

  getObstacleAt(x: number, y: number): Obstacle | null {
    for (const obstacle of this.obstacles) {
      if (obstacle.obstacle.type === "rect") {
        const halfWidth = obstacle.obstacle.width / 2 + 0.1
        const halfHeight = obstacle.obstacle.height / 2 + 0.1
        if (
          x >= obstacle.obstacle.center.x - halfWidth &&
          x <= obstacle.obstacle.center.x + halfWidth &&
          y >= obstacle.obstacle.center.y - halfHeight &&
          y <= obstacle.obstacle.center.y + halfHeight
        ) {
          return obstacle.obstacle
        }
      }
    }
    return null
  }

  isObstacleAt(x: number, y: number): boolean {
    return this.getObstacleAt(x, y) !== null
  }

  getDirectionDistancesToNearestObstacle(
    x: number,
    y: number,
  ): DirectionDistances {
    const { GRID_STEP } = this
    const result: DirectionDistances = {
      left: Infinity,
      top: Infinity,
      bottom: Infinity,
      right: Infinity,
    }

    for (const obstacle of this.obstacles) {
      if (obstacle.obstacle.type === "rect") {
        const left =
          obstacle.obstacle.center.x - obstacle.obstacle.width / 2 - GRID_STEP
        const right =
          obstacle.obstacle.center.x + obstacle.obstacle.width / 2 + GRID_STEP
        const top =
          obstacle.obstacle.center.y + obstacle.obstacle.height / 2 + GRID_STEP
        const bottom =
          obstacle.obstacle.center.y - obstacle.obstacle.height / 2 - GRID_STEP

        // Check left
        if (y >= bottom && y <= top && x > left) {
          result.left = Math.min(result.left, x - right)
        }

        // Check right
        if (y >= bottom && y <= top && x < right) {
          result.right = Math.min(result.right, left - x)
        }

        // Check top
        if (x >= left && x <= right && y < top) {
          result.top = Math.min(result.top, bottom - y)
        }

        // Check bottom
        if (x >= left && x <= right && y > bottom) {
          result.bottom = Math.min(result.bottom, y - top)
        }
      }
    }

    return result
  }
}
