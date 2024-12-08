// ObstacleList3dOptimized.ts

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

const STRIDE = 10
const TYPE_RECT = 0

export class ObstacleList3dF64V2 extends ObstacleList3d {
  data: Float64Array
  originalObstacles: ObstacleWithEdges3d[]
  GRID_STEP = 0.1
  layerCount: number

  // Arrays for faster direction-specific queries
  // Each entry: obstaclesByLeft[layer] = array of indices into `data` sorted by LEFT
  obstaclesByLeft: number[][]
  obstaclesByRight: number[][]
  obstaclesByTop: number[][]
  obstaclesByBottom: number[][]

  constructor(layerCount: number, obstacles: Array<Obstacle>) {
    super(layerCount, [])
    this.layerCount = layerCount
    const availableLayers = getLayerNamesForLayerCount(layerCount)

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
      this.data[base + TYPE] = TYPE_RECT
    }

    // Build direction-specific indexes
    this.obstaclesByLeft = []
    this.obstaclesByRight = []
    this.obstaclesByTop = []
    this.obstaclesByBottom = []

    for (let layer = 0; layer < layerCount; layer++) {
      const indicesForLayer: number[] = []
      for (let i = 0; i < count; i++) {
        const base = i * STRIDE
        if (this.data[base + LAYER] === layer) {
          indicesForLayer.push(i)
        }
      }

      // Sort by LEFT
      const byLeft = indicesForLayer
        .slice()
        .sort(
          (a, b) => this.data[a * STRIDE + LEFT] - this.data[b * STRIDE + LEFT],
        )
      const byRight = indicesForLayer
        .slice()
        .sort(
          (a, b) =>
            this.data[a * STRIDE + RIGHT] - this.data[b * STRIDE + RIGHT],
        )
      const byTop = indicesForLayer.slice().sort(
        (a, b) => this.data[b * STRIDE + TOP] - this.data[a * STRIDE + TOP], // descending top
      )
      const byBottom = indicesForLayer
        .slice()
        .sort(
          (a, b) =>
            this.data[a * STRIDE + BOTTOM] - this.data[b * STRIDE + BOTTOM],
        )

      this.obstaclesByLeft[layer] = byLeft
      this.obstaclesByRight[layer] = byRight
      this.obstaclesByTop[layer] = byTop
      this.obstaclesByBottom[layer] = byBottom
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
      const cx = data[base + CENTER_X]
      const cy = data[base + CENTER_Y]

      if (
        x >= cx - halfWidth &&
        x <= cx + halfWidth &&
        y >= cy - halfHeight &&
        y <= cy + halfHeight
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
    // This method can remain unchanged or also benefit from the indexes if needed.
    // For brevity, we keep it as is:
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
      // Layer change remains O(1), just check the next layer
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
    }

    // Horizontal or vertical movement within the same layer
    let candidateIndices: number[] | null = null
    let searchValue: number
    let verticalCheck: (base: number) => boolean
    let horizontalCheck: (base: number) => boolean

    const { data } = this

    if (dx === 1 && dy === 0) {
      // Moving right: find obstacles with left > x
      candidateIndices = this.obstaclesByLeft[l]
      searchValue = x
      verticalCheck = (base: number) =>
        y > data[base + BOTTOM] - margin && y < data[base + TOP] + margin
      horizontalCheck = (base: number) => data[base + LEFT] > x
    } else if (dx === -1 && dy === 0) {
      // Moving left: find obstacles with right < x
      candidateIndices = this.obstaclesByRight[l]
      searchValue = x
      verticalCheck = (base: number) =>
        y > data[base + BOTTOM] - margin && y < data[base + TOP] + margin
      horizontalCheck = (base: number) => data[base + RIGHT] < x
    } else if (dx === 0 && dy === 1) {
      // Moving up: find obstacles with bottom > y
      candidateIndices = this.obstaclesByBottom[l]
      searchValue = y
      verticalCheck = (base: number) =>
        x > data[base + LEFT] - margin && x < data[base + RIGHT] + margin
      horizontalCheck = (base: number) => data[base + BOTTOM] > y
    } else if (dx === 0 && dy === -1) {
      // Moving down: find obstacles with top < y
      candidateIndices = this.obstaclesByTop[l]
      searchValue = y
      verticalCheck = (base: number) =>
        x > data[base + LEFT] - margin && x < data[base + RIGHT] + margin
      horizontalCheck = (base: number) => data[base + TOP] < y
    } else {
      // No movement
      return {
        dx,
        dy,
        dl: 0,
        wallDistance: Infinity,
        obstacle: null,
      }
    }

    // Binary search in the chosen array for the first obstacle boundary
    // that meets the horizontal/vertical condition (e.g., left > x)
    let low = 0
    let high = candidateIndices.length - 1
    let idx = candidateIndices.length // Default: no candidate found

    // Depending on direction, we adjust comparison
    const compareFn = () => {
      // For right movement: we want the first obstacle where LEFT > x
      // For left movement: we want the last obstacle where RIGHT < x (so first from right array that is strictly less than x)
      // For up: first obstacle where BOTTOM > y
      // For down: last obstacle where TOP < y
    }

    while (low <= high) {
      const mid = (low + high) >>> 1
      const obstIndex = candidateIndices[mid]
      const base = obstIndex * STRIDE
      let val: number
      if (dx === 1) val = data[base + LEFT]
      else if (dx === -1) val = data[base + RIGHT]
      else if (dy === 1) val = data[base + BOTTOM]
      else val = data[base + TOP]

      if (
        (dx === 1 && val > searchValue) || // moving right
        (dx === -1 && val < searchValue) || // moving left
        (dy === 1 && val > searchValue) || // moving up
        (dy === -1 && val < searchValue)
      ) {
        // moving down
        idx = mid
        // We can still try to find a closer obstacle in that direction
        if (dx === 1 || dy === 1) {
          // Move left in array for first larger boundary
          high = mid - 1
        } else {
          // Move right in array for last smaller boundary
          low = mid + 1
        }
      } else {
        // Not meeting condition, we move in opposite direction
        if (dx === 1 || dy === 1) {
          low = mid + 1
        } else {
          high = mid - 1
        }
      }
    }

    let minDistance = Infinity
    let collisionObstacle: ObstacleWithEdges | null = null

    // If idx is within array bounds, check candidates around idx for vertical/horizontal overlap
    // Because binary search gives us a position, we might want to check the found index and neighbors
    // to ensure we find the closest suitable obstacle. Usually, checking a few neighbors is enough.
    for (let checkOffset = 0; checkOffset < 5; checkOffset++) {
      const candidateIdx =
        dx === 1 || dy === 1 ? idx + checkOffset : idx - checkOffset
      if (candidateIdx < 0 || candidateIdx >= candidateIndices.length) break

      const obstIndex = candidateIndices[candidateIdx]
      const base = obstIndex * STRIDE

      // Check direction conditions again
      if (!horizontalCheck(base) && !verticalCheck(base)) continue

      // Now ensure vertical/horizontal overlap:
      if (
        (dx !== 0 && verticalCheck(base)) ||
        (dy !== 0 && verticalCheck(base))
      ) {
        let distance: number | null = null

        if (dx === 1) {
          distance = data[base + LEFT] - margin - x
        } else if (dx === -1) {
          distance = x - (data[base + RIGHT] + margin)
        } else if (dy === 1) {
          distance = data[base + BOTTOM] - margin - y
        } else if (dy === -1) {
          distance = y - (data[base + TOP] + margin)
        }

        if (distance !== null && distance > 0 && distance < minDistance) {
          minDistance = distance
          collisionObstacle = this.originalObstacles[obstIndex]
        }
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

  getObstaclesOverlappingRegion(region: {
    minX: number
    minY: number
    maxX: number
    maxY: number
    l: number
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
