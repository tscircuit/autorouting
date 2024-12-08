// ObstacleList3dFastWithSorting.ts

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
// We can store a type if needed, currently unused in sorting.
// const TYPE = 9
const STRIDE = 10

export class ObstacleList3dF64V2 extends ObstacleList3d {
  data: Float64Array
  originalObstacles: ObstacleWithEdges3d[]
  GRID_STEP = 0.1
  layerCount: number

  // Arrays of obstacle indices per layer sorted by their boundaries
  obstaclesByLeft: number[][]
  obstaclesByRight: number[][]
  obstaclesByTop: number[][]
  obstaclesByBottom: number[][]

  minX: number
  maxX: number
  minY: number
  maxY: number

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

    let minX = Infinity
    let maxX = -Infinity
    let minY = Infinity
    let maxY = -Infinity

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

      if (obs.left < minX) minX = obs.left
      if (obs.right > maxX) maxX = obs.right
      if (obs.bottom < minY) minY = obs.bottom
      if (obs.top > maxY) maxY = obs.top
    }

    // Compute cell sizes based on bounding box
    // If no obstacles, handle gracefully
    if (count === 0) {
      minX = 0
      maxX = 1
      minY = 0
      maxY = 1
    }

    this.minX = minX
    this.maxX = maxX
    this.minY = minY
    this.maxY = maxY

    // Initialize arrays
    this.obstaclesByLeft = Array.from({ length: layerCount }, () => [])
    this.obstaclesByRight = Array.from({ length: layerCount }, () => [])
    this.obstaclesByTop = Array.from({ length: layerCount }, () => [])
    this.obstaclesByBottom = Array.from({ length: layerCount }, () => [])

    // Distribute obstacle indices into these arrays
    for (let i = 0; i < count; i++) {
      const base = i * STRIDE
      const l = this.data[base + LAYER]
      const li = l | 0 // layer as integer

      this.obstaclesByLeft[li].push(i)
      this.obstaclesByRight[li].push(i)
      this.obstaclesByTop[li].push(i)
      this.obstaclesByBottom[li].push(i)
    }

    // Sort each array by their respective edges
    for (let l = 0; l < layerCount; l++) {
      this.obstaclesByLeft[l].sort(
        (a, b) => this.data[a * STRIDE + LEFT] - this.data[b * STRIDE + LEFT],
      )
      this.obstaclesByRight[l].sort(
        (a, b) => this.data[a * STRIDE + RIGHT] - this.data[b * STRIDE + RIGHT],
      )
      this.obstaclesByTop[l].sort(
        (a, b) => this.data[a * STRIDE + TOP] - this.data[b * STRIDE + TOP],
      )
      this.obstaclesByBottom[l].sort(
        (a, b) =>
          this.data[a * STRIDE + BOTTOM] - this.data[b * STRIDE + BOTTOM],
      )
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
    // This method remains O(n). If needed, we could also optimize it similarly.
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

  /**
   * Binary search utility: finds the insertion index for value in a sorted array,
   * similar to Python's bisect_left. Returns index where value could be inserted
   * to maintain sorted order. If exact match is found, returns that index.
   */
  private bisectLeft(
    array: number[],
    getVal: (i: number) => number,
    value: number,
  ): number {
    let low = 0
    let high = array.length
    while (low < high) {
      const mid = (low + high) >>> 1
      if (getVal(array[mid]) < value) low = mid + 1
      else high = mid
    }
    return low
  }

  /**
   * Binary search utility: finds the insertion index for value similar to bisect_right,
   * returns the insertion point to the right of existing entries of value.
   */
  private bisectRight(
    array: number[],
    getVal: (i: number) => number,
    value: number,
  ): number {
    let low = 0
    let high = array.length
    while (low < high) {
      const mid = (low + high) >>> 1
      if (getVal(array[mid]) <= value) low = mid + 1
      else high = mid
    }
    return low
  }

  getOrthoDirectionCollisionInfo(
    point: Point3d,
    dir: Direction3d,
    { margin = 0 }: { margin?: number } = {},
  ): DirectionWithCollisionInfo3d {
    const { x, y, l } = point
    const { dx, dy, dl } = dir

    if (dl !== 0) {
      // Layer change is unchanged - no spatial optimization for layer transitions.
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

    // Moving within the same layer
    // Determine which sorted array to use based on direction
    const layerIndex = l | 0
    let candidates: number[] = []
    let edgeGetter: (i: number) => number
    let forwardSearch = true

    if (dx === 1 && dy === 0) {
      // Moving right, check obstaclesByLeft:
      // We want the smallest left that is > x
      candidates = this.obstaclesByLeft[layerIndex]
      edgeGetter = (idx) => this.data[idx * STRIDE + LEFT]
      // We'll binary search for the first obstacle with LEFT > x
      const startIndex = this.bisectLeft(candidates, edgeGetter, x)
      return this.findCollisionCandidateHorizontal(
        candidates,
        startIndex,
        x,
        y,
        margin,
        dx,
        dy,
        /*movingRight=*/ true,
      )
    } else if (dx === -1 && dy === 0) {
      // Moving left, check obstaclesByRight:
      // We want the largest right that is < x. We'll use bisectLeft for x and then go one left.
      candidates = this.obstaclesByRight[layerIndex]
      edgeGetter = (idx) => this.data[idx * STRIDE + RIGHT]
      // Find insertion for x in RIGHT array
      const startIndex = this.bisectLeft(candidates, edgeGetter, x) - 1
      return this.findCollisionCandidateHorizontal(
        candidates,
        startIndex,
        x,
        y,
        margin,
        dx,
        dy,
        /*movingRight=*/ false,
      )
    } else if (dx === 0 && dy === 1) {
      // Moving up, check obstaclesByBottom:
      // We want the smallest bottom that is > y
      candidates = this.obstaclesByBottom[layerIndex]
      edgeGetter = (idx) => this.data[idx * STRIDE + BOTTOM]
      const startIndex = this.bisectLeft(candidates, edgeGetter, y)
      return this.findCollisionCandidateVertical(
        candidates,
        startIndex,
        x,
        y,
        margin,
        dx,
        dy,
        /*movingUp=*/ true,
      )
    } else if (dx === 0 && dy === -1) {
      // Moving down, check obstaclesByTop:
      // We want the largest top that is < y
      candidates = this.obstaclesByTop[layerIndex]
      edgeGetter = (idx) => this.data[idx * STRIDE + TOP]
      const startIndex = this.bisectLeft(candidates, edgeGetter, y) - 1
      return this.findCollisionCandidateVertical(
        candidates,
        startIndex,
        x,
        y,
        margin,
        dx,
        dy,
        /*movingUp=*/ false,
      )
    } else {
      // No movement
      return { dx, dy, dl: 0, wallDistance: Infinity, obstacle: null }
    }
  }

  private findCollisionCandidateHorizontal(
    candidates: number[],
    startIndex: number,
    x: number,
    y: number,
    margin: number,
    dx: number,
    dy: number,
    movingRight: boolean,
  ): DirectionWithCollisionInfo3d {
    // If movingRight = true, we start from startIndex and move forward
    // If movingRight = false, we start from startIndex and move backward
    const step = movingRight ? 1 : -1
    const { data } = this
    let minDistance = Infinity
    let collisionObstacle: ObstacleWithEdges | null = null

    for (let i = startIndex; i >= 0 && i < candidates.length; i += step) {
      const idx = candidates[i]
      const base = idx * STRIDE

      // Vertical overlap check:
      const topMargin = data[base + TOP] + margin
      const bottomMargin = data[base + BOTTOM] - margin
      const leftMargin = data[base + LEFT] - margin
      const rightMargin = data[base + RIGHT] + margin

      if (y > bottomMargin && y < topMargin) {
        // Compute distance
        let distance: number
        if (dx === 1) {
          // moving right: obstacle's left edge is relevant
          distance = leftMargin - x
          if (distance >= 0 && distance < minDistance) {
            minDistance = distance
            collisionObstacle = this.originalObstacles[idx]
            break
          }
        } else {
          // moving left: obstacle's right edge is relevant
          distance = x - rightMargin
          if (distance >= 0 && distance < minDistance) {
            minDistance = distance
            collisionObstacle = this.originalObstacles[idx]
            break
          }
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

  private findCollisionCandidateVertical(
    candidates: number[],
    startIndex: number,
    x: number,
    y: number,
    margin: number,
    dx: number,
    dy: number,
    movingUp: boolean,
  ): DirectionWithCollisionInfo3d {
    // Similar logic for vertical movement
    const step = movingUp ? 1 : -1
    const { data } = this
    let minDistance = Infinity
    let collisionObstacle: ObstacleWithEdges | null = null

    for (let i = startIndex; i >= 0 && i < candidates.length; i += step) {
      const idx = candidates[i]
      const base = idx * STRIDE

      const leftMargin = data[base + LEFT] - margin
      const rightMargin = data[base + RIGHT] + margin
      const topMargin = data[base + TOP] + margin
      const bottomMargin = data[base + BOTTOM] - margin

      if (x > leftMargin && x < rightMargin) {
        let distance: number
        if (dy === 1) {
          // moving up: obstacle's bottom edge is relevant
          distance = bottomMargin - y
          if (distance >= 0 && distance < minDistance) {
            minDistance = distance
            collisionObstacle = this.originalObstacles[idx]
            break
          }
        } else {
          // moving down: obstacle's top edge is relevant
          distance = y - topMargin
          if (distance >= 0 && distance < minDistance) {
            minDistance = distance
            collisionObstacle = this.originalObstacles[idx]
            break
          }
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
    l: number // Layer to check
  }): ObstacleWithEdges[] {
    // This remains the same O(n) approach. It can also be improved using spatial indexing if needed.
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
