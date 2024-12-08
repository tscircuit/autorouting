// ObstacleList3d.ts

import type { Obstacle, ObstacleWithEdges } from "solver-utils"
import type {
  Direction3d,
  DirectionDistances3d,
  DirectionWithCollisionInfo3d,
  ObstacleWithEdges3d,
  Point3d,
} from "./types"
import { getLayerIndex, getLayerNamesForLayerCount } from "./util"
import { ObstacleList } from "./ObstacleList"

/**
 * A list of obstacles with functions for fast lookups, this default implementation
 * has no optimizations, you should override this class to implement faster lookups
 */
export class ObstacleList3d extends ObstacleList {
  obstacles: ObstacleWithEdges3d[]
  GRID_STEP = 0.1
  layerCount: number

  constructor(layerCount: number, obstacles: Array<Obstacle>) {
    super([])
    this.layerCount = layerCount
    const availableLayers = getLayerNamesForLayerCount(layerCount)
    this.obstacles = obstacles.flatMap((obstacle) =>
      obstacle.layers
        .filter((layer) => availableLayers.includes(layer))
        .map((layer) => ({
          ...obstacle,
          left: obstacle.center.x - obstacle.width / 2,
          right: obstacle.center.x + obstacle.width / 2,
          top: obstacle.center.y + obstacle.height / 2,
          bottom: obstacle.center.y - obstacle.height / 2,
          l: getLayerIndex(layerCount, layer),
        })),
    )
  }

  getObstacleAt(x: number, y: number, l: number, m?: number): Obstacle | null {
    m ??= this.GRID_STEP
    for (const obstacle of this.obstacles) {
      if (obstacle.l !== l) continue // Only consider obstacles on the same layer
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

  isObstacleAt(x: number, y: number, l: number, m?: number): boolean {
    return this.getObstacleAt(x, y, l, m) !== null
  }

  getDirectionDistancesToNearestObstacle3d(
    x: number,
    y: number,
    l: number,
  ): DirectionDistances3d {
    const { GRID_STEP } = this
    const result: DirectionDistances3d = {
      left: Infinity,
      top: Infinity,
      bottom: Infinity,
      right: Infinity,
    }

    for (const obstacle of this.obstacles) {
      if (obstacle.l !== l) continue // Only consider obstacles on the same layer
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

  // cases: any = {}
  getOrthoDirectionCollisionInfo(
    point: Point3d,
    dir: Direction3d,
    { margin = 0 }: { margin?: number } = {},
  ): DirectionWithCollisionInfo3d {
    const { x, y, l } = point
    const { dx, dy, dl } = dir
    // const xHash = [l, x.toFixed(3), dy, dl].join(",")
    // const yHash = [l, y.toFixed(3), dx, dl].join(",")
    // if (dy !== 0) {
    //   this.cases[xHash] ??= []
    //   this.cases[xHash].push(y)
    // }
    // if (dx !== 0) {
    //   this.cases[yHash] ??= []
    //   this.cases[yHash].push(x)
    // }
    let minDistance = Infinity
    let collisionObstacle: ObstacleWithEdges | null = null

    if (dl !== 0) {
      // Moving between layers
      const newLayer = l + dl
      // Check if there's an obstacle at the same (x, y) on the new layer
      if (this.isObstacleAt(x, y, newLayer, margin)) {
        minDistance = 1 // Distance to obstacle is 1 (layer change)
        collisionObstacle = this.getObstacleAt(
          x,
          y,
          newLayer,
          margin,
        ) as ObstacleWithEdges
      } else {
        minDistance = 1 // Distance to move to the next layer
      }

      return {
        dx,
        dy,
        dl,
        wallDistance: minDistance,
        obstacle: collisionObstacle,
      }
    } else {
      // Moving within the same layer
      for (const obstacle of this.obstacles) {
        if (obstacle.l !== l) continue // Only consider obstacles on the same layer

        const leftMargin = obstacle.left - margin
        const rightMargin = obstacle.right + margin
        const topMargin = obstacle.top + margin
        const bottomMargin = obstacle.bottom - margin

        let distance: number | null = null

        if (dx === 1 && dy === 0) {
          // Right
          if (y > bottomMargin && y < topMargin && x < obstacle.left) {
            distance = obstacle.left - x
          }
        } else if (dx === -1 && dy === 0) {
          // Left
          if (y > bottomMargin && y < topMargin && x > obstacle.right) {
            distance = x - obstacle.right
          }
        } else if (dx === 0 && dy === 1) {
          // Up
          if (x > leftMargin && x < rightMargin && y < obstacle.bottom) {
            distance = obstacle.bottom - y
          }
        } else if (dx === 0 && dy === -1) {
          // Down
          if (x > leftMargin && x < rightMargin && y > obstacle.top) {
            distance = y - obstacle.top
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
        dl: 0,
        wallDistance: minDistance,
        obstacle: collisionObstacle as ObstacleWithEdges,
      }
    }
  }

  getObstaclesOverlappingRegion(region: {
    minX: number
    minY: number
    maxX: number
    maxY: number
    l: number // Layer to check
  }): ObstacleWithEdges[] {
    const obstacles: ObstacleWithEdges[] = []
    for (const obstacle of this.obstacles) {
      if (obstacle.l !== region.l) continue // Only consider obstacles on the specified layer
      const { left, right, top, bottom } = obstacle

      if (
        left <= region.maxX &&
        right >= region.minX &&
        top >= region.minY &&
        bottom <= region.maxY
      ) {
        obstacles.push(obstacle)
      }
    }

    return obstacles
  }
}
