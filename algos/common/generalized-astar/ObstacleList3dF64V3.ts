// ObstacleList3dCellBased.ts

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

const CELL_COLS = 16
const CELL_ROWS = 16

const CENTER_X = 0
const CENTER_Y = 1
const WIDTH = 2
const HEIGHT = 3
const LAYER = 4
const TOP = 5
const BOTTOM = 6
const LEFT = 7
const RIGHT = 8
const STRIDE = 10

export class ObstacleList3dF64V3 extends ObstacleList3d {
  data: Float64Array
  originalObstacles: ObstacleWithEdges3d[]
  GRID_STEP = 0.1
  layerCount: number

  // Cells: each cell is lazily filled with obstacle indices
  // Key: row * CELL_COLS + col
  cells: (number[] | null)[]

  // Bounding box for all obstacles
  minX: number
  maxX: number
  minY: number
  maxY: number
  cellWidth: number
  cellHeight: number

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

    const totalWidth = this.maxX - this.minX || 1
    const totalHeight = this.maxY - this.minY || 1
    this.cellWidth = totalWidth / CELL_COLS
    this.cellHeight = totalHeight / CELL_ROWS

    // Initialize cells to null for lazy filling
    this.cells = Array(CELL_COLS * CELL_ROWS).fill(null)
  }

  private getCellIndexForPoint(x: number, y: number): number | null {
    // Compute which cell (x,y) falls into
    const col = Math.floor(
      ((x - this.minX) / (this.maxX - this.minX)) * CELL_COLS,
    )
    const row = Math.floor(
      ((y - this.minY) / (this.maxY - this.minY)) * CELL_ROWS,
    )

    if (col < 0 || col >= CELL_COLS || row < 0 || row >= CELL_ROWS) {
      return null // Point outside the bounding box range
    }
    return row * CELL_COLS + col
  }

  private fillCell(cellIndex: number) {
    // If the cell is not filled, we scan all obstacles to find which belong here
    if (this.cells[cellIndex] !== null) return // Already filled

    const row = Math.floor(cellIndex / CELL_COLS)
    const col = cellIndex % CELL_COLS

    const cellMinX = this.minX + col * this.cellWidth
    const cellMaxX = cellMinX + this.cellWidth
    const cellMinY = this.minY + row * this.cellHeight
    const cellMaxY = cellMinY + this.cellHeight

    const { data } = this
    const count = data.length / STRIDE
    const cellObstacles: number[] = []

    for (let i = 0; i < count; i++) {
      const base = i * STRIDE
      const left = data[base + LEFT]
      const right = data[base + RIGHT]
      const top = data[base + TOP]
      const bottom = data[base + BOTTOM]

      // Check if obstacle overlaps this cell at all
      if (
        right >= cellMinX &&
        left <= cellMaxX &&
        top >= cellMinY &&
        bottom <= cellMaxY
      ) {
        cellObstacles.push(i)
      }
    }

    this.cells[cellIndex] = cellObstacles
  }

  getObstacleAt(
    x: number,
    y: number,
    l: number,
    m?: number,
  ): ObstacleWithEdges | null {
    m ??= this.GRID_STEP

    const cellIndex = this.getCellIndexForPoint(x, y)
    if (cellIndex === null) {
      // Out of range, just scan all or return null
      // For simplicity, return null. If needed, handle differently.
      return null
    }

    this.fillCell(cellIndex)
    const cellObstacles = this.cells[cellIndex]!
    const { data } = this

    for (let idx of cellObstacles) {
      const base = idx * STRIDE
      // Check layer
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
        return this.originalObstacles[idx]
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
    // This method is unchanged, still O(n), but can be similarly optimized if needed.
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
    // This method is unchanged. Could also be optimized using spatial partitioning if needed.
    const { x, y, l } = point
    const { dx, dy, dl } = dir
    let minDistance = Infinity
    let collisionObstacle: ObstacleWithEdges | null = null

    if (dl !== 0) {
      // Moving between layers
      const newLayer = l + dl
      if (this.isObstacleAt(x, y, newLayer, margin)) {
        minDistance = 1 // Distance to obstacle is 1 (layer change)
        collisionObstacle = this.getObstacleAt(
          x,
          y,
          newLayer,
          margin,
        ) as ObstacleWithEdges
      } else {
        minDistance = 1 // No obstacle, just distance to next layer
      }

      return {
        dx,
        dy,
        dl,
        wallDistance: minDistance,
        obstacle: collisionObstacle,
      }
    } else {
      const { data } = this
      const count = data.length / STRIDE

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
