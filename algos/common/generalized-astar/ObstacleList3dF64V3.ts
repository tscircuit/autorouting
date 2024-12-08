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
import { ObstacleList3dF64V2 } from "./ObstacleList3dF64V2"

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

export class ObstacleList3dF64V3 extends ObstacleList3dF64V2 {
  GRID_STEP = 0.1
  layerCount: number

  // Cells: each cell is lazily filled with obstacle indices
  // Key: row * CELL_COLS + col
  cells: (number[] | null)[]

  cellWidth: number
  cellHeight: number

  constructor(layerCount: number, obstacles: Array<Obstacle>) {
    super(layerCount, obstacles)
    this.layerCount = layerCount
    const availableLayers = getLayerNamesForLayerCount(layerCount)

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
}
