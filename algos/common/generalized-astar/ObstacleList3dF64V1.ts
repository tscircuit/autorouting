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
import { ObstacleList3d } from "./ObstacleList3d"

/**
 * Indices for each obstacle property in the data array.
 * Each obstacle is stored in this order:
 * [centerX, centerY, width, height, l, top, bottom, left, right, typeCode]
 */
const CENTER_X = 0
const CENTER_Y = 1
const WIDTH = 2
const HEIGHT = 3
const LAYER = 4
const TOP = 5
const BOTTOM = 6
const LEFT = 7
const RIGHT = 8
const TYPE = 9

// Number of numeric fields per obstacle
const STRIDE = 10

// We can define numeric codes for obstacle types.
// For simplicity, let's assume all obstacles are rect for now.
const TYPE_RECT = 0

export class ObstacleList3dF64V1 extends ObstacleList3d {
  data: Float64Array
  originalObstacles: ObstacleWithEdges3d[]
  GRID_STEP = 0.1
  layerCount: number

  constructor(layerCount: number, obstacles: Array<Obstacle>) {
    super(layerCount, [])
    this.layerCount = layerCount
    const availableLayers = getLayerNamesForLayerCount(layerCount)

    // Filter and expand obstacles based on layers
    const filtered: ObstacleWithEdges3d[] = obstacles.flatMap((obstacle) =>
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

    this.originalObstacles = filtered
    const count = filtered.length
    this.data = new Float64Array(count * STRIDE)

    for (let i = 0; i < count; i++) {
      const obs = filtered[i]
      const base = i * STRIDE
      this.data[base + CENTER_X] = obs.center.x
      this.data[base + CENTER_Y] = obs.center.y
      this.data[base + WIDTH] = obs.width
      this.data[base + HEIGHT] = obs.height
      this.data[base + LAYER] = obs.l
      this.data[base + TOP] = obs.top
      this.data[base + BOTTOM] = obs.bottom
      this.data[base + LEFT] = obs.left
      this.data[base + RIGHT] = obs.right
      // Assuming type is always 'rect' for these obstacles. If needed, map other types.
      this.data[base + TYPE] = TYPE_RECT
    }
  }

  getObstacleAt(
    x: number,
    y: number,
    l: number,
    m?: number,
  ): ObstacleWithEdges | null {
    m ??= this.GRID_STEP
    const { data } = this
    const count = data.length / STRIDE
    for (let i = 0; i < count; i++) {
      const base = i * STRIDE
      if (data[base + LAYER] !== l) continue
      const halfWidth = data[base + WIDTH] / 2 + m
      const halfHeight = data[base + HEIGHT] / 2 + m
      const centerX = data[base + CENTER_X]
      const centerY = data[base + CENTER_Y]

      if (
        x >= centerX - halfWidth &&
        x <= centerX + halfWidth &&
        y >= centerY - halfHeight &&
        y <= centerY + halfHeight
      ) {
        return this.originalObstacles[i]
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
    const { GRID_STEP, data } = this
    const count = data.length / STRIDE

    const result: DirectionDistances3d = {
      left: Infinity,
      top: Infinity,
      bottom: Infinity,
      right: Infinity,
    }

    for (let i = 0; i < count; i++) {
      const base = i * STRIDE
      if (data[base + LAYER] !== l) continue
      // Assume rect
      const left = data[base + LEFT] - GRID_STEP
      const right = data[base + RIGHT] + GRID_STEP
      const top = data[base + TOP] + GRID_STEP
      const bottom = data[base + BOTTOM] - GRID_STEP

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

    return result
  }

  getOrthoDirectionCollisionInfo(
    point: Point3d,
    dir: Direction3d,
    { margin = 0 }: { margin?: number } = {},
  ): DirectionWithCollisionInfo3d {
    const { x, y, l } = point
    const { dx, dy, dl } = dir

    if (dl !== 0) {
      // Moving between layers
      const newLayer = l + dl
      let collisionObstacle: ObstacleWithEdges | null = null
      let minDistance = 1
      if (this.isObstacleAt(x, y, newLayer, margin)) {
        collisionObstacle = this.getObstacleAt(
          x,
          y,
          newLayer,
          margin,
        ) as ObstacleWithEdges
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
      const { data } = this
      const count = data.length / STRIDE
      let minDistance = Infinity
      let collisionObstacle: ObstacleWithEdges | null = null

      for (let i = 0; i < count; i++) {
        const base = i * STRIDE
        if (data[base + LAYER] !== l) continue

        const leftMargin = data[base + LEFT] - margin
        const rightMargin = data[base + RIGHT] + margin
        const topMargin = data[base + TOP] + margin
        const bottomMargin = data[base + BOTTOM] - margin

        let distance: number | null = null

        if (dx === 1 && dy === 0) {
          // Right
          if (y > bottomMargin && y < topMargin && x < leftMargin) {
            distance = leftMargin - x
          }
        } else if (dx === -1 && dy === 0) {
          // Left
          if (y > bottomMargin && y < topMargin && x > rightMargin) {
            distance = x - rightMargin
          }
        } else if (dx === 0 && dy === 1) {
          // Up
          if (x > leftMargin && x < rightMargin && y < bottomMargin) {
            distance = bottomMargin - y
          }
        } else if (dx === 0 && dy === -1) {
          // Down
          if (x > leftMargin && x < rightMargin && y > topMargin) {
            distance = y - topMargin
          }
        }

        if (distance !== null && distance < minDistance) {
          minDistance = distance
          collisionObstacle = this.originalObstacles[i]
        }
      }

      return {
        dx,
        dy,
        dl: 0,
        wallDistance: minDistance,
        obstacle: collisionObstacle,
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
    const { data, originalObstacles } = this
    const count = data.length / STRIDE
    const obstacles: ObstacleWithEdges[] = []

    for (let i = 0; i < count; i++) {
      const base = i * STRIDE
      if (data[base + LAYER] !== region.l) continue
      const left = data[base + LEFT]
      const right = data[base + RIGHT]
      const top = data[base + TOP]
      const bottom = data[base + BOTTOM]

      if (
        left <= region.maxX &&
        right >= region.minX &&
        top >= region.minY &&
        bottom <= region.maxY
      ) {
        obstacles.push(originalObstacles[i])
      }
    }

    return obstacles
  }
}
