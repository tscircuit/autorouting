import type { Obstacle, ObstacleWithEdges } from "autorouting-dataset"
import type {
  Direction,
  DirectionDistances,
  DirectionWithCollisionInfo,
  Point,
} from "./types"

/**
 * A list of obstacles with functions for fast lookups, this default implementation
 * has no optimizations, you should override this class to implement faster lookups
 */
export class ObstacleList {
  protected obstacles: ObstacleWithEdges[]
  protected GRID_STEP = 0.1

  constructor(obstacles: Array<Obstacle>) {
    this.obstacles = obstacles.map((obstacle) => ({
      ...obstacle,
      left: obstacle.center.x - obstacle.width / 2,
      right: obstacle.center.x + obstacle.width / 2,
      top: obstacle.center.y + obstacle.height / 2,
      bottom: obstacle.center.y - obstacle.height / 2,
    }))
  }

  getObstacleAt(x: number, y: number, m?: number): Obstacle | null {
    m ??= this.GRID_STEP
    for (const obstacle of this.obstacles) {
      const halfWidth = obstacle.width / 2 + m
      const halfHeight = obstacle.height / 2 + m
      if (
        x >= obstacle.center.x - halfWidth &&
        x <= obstacle.center.x + halfWidth &&
        y >= obstacle.center.y - halfHeight &&
        y <= obstacle.center.y + halfHeight
      ) {
        return obstacle
      }
    }
    return null
  }

  isObstacleAt(x: number, y: number, m?: number): boolean {
    return this.getObstacleAt(x, y, m) !== null
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
      if (obstacle.type === "rect") {
        const left = obstacle.center.x - obstacle.width / 2 - GRID_STEP
        const right = obstacle.center.x + obstacle.width / 2 + GRID_STEP
        const top = obstacle.center.y + obstacle.height / 2 + GRID_STEP
        const bottom = obstacle.center.y - obstacle.height / 2 - GRID_STEP

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

  getOrthoDirectionCollisionInfo(
    point: Point,
    dir: Direction,
  ): DirectionWithCollisionInfo {
    const { x, y } = point
    const { dx, dy } = dir
    let minDistance = Infinity
    let collisionObstacle: ObstacleWithEdges | null = null

    for (const obstacle of this.obstacles) {
      const { left, right, top, bottom } = obstacle

      let distance: number | null = null

      if (dx === 1 && dy === 0) {
        // Right
        if (y >= bottom && y <= top && x < left) {
          distance = left - x
        }
      } else if (dx === -1 && dy === 0) {
        // Left
        if (y >= bottom && y <= top && x > right) {
          distance = x - right
        }
      } else if (dx === 0 && dy === 1) {
        // Up
        if (x >= left && x <= right && y < bottom) {
          distance = bottom - y
        }
      } else if (dx === 0 && dy === -1) {
        // Down
        if (x >= left && x <= right && y > top) {
          distance = y - top
        }
      }

      if (distance !== null && distance < minDistance) {
        minDistance = distance
        collisionObstacle = obstacle
      }
    }

    return {
      dx,
      dy,
      wallDistance: minDistance,
      obstacle: collisionObstacle as ObstacleWithEdges,
    }
  }
}
