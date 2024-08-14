import {
  getSimpleRouteJson,
  type SimplifiedPcbTrace,
  type Obstacle,
  type SimpleRouteJson,
} from "autorouting-dataset"
import { getLineRectangleIntersection } from "autorouting-dataset/lib/solver-utils/getLineRectangleIntersection"

import type { AnySoupElement } from "@tscircuit/soup"

interface Point {
  x: number
  y: number
}

interface Node extends Point {
  f: number
  g: number
  h: number
  parent: Node | null
}

function manhattanDistance(a: Point, b: Point): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y)
}

interface DirectionDistances {
  left: number
  top: number
  bottom: number
  right: number
}

function directionDistancesToNearestObstacle(
  x: number,
  y: number,
  input: SimpleRouteJson,
): DirectionDistances {
  const result: DirectionDistances = {
    left: Infinity,
    top: Infinity,
    bottom: Infinity,
    right: Infinity,
  }

  for (const obstacle of input.obstacles) {
    if (obstacle.type === "rect") {
      const left = obstacle.center.x - obstacle.width / 2 - OBSTACLE_MARGIN
      const right = obstacle.center.x + obstacle.width / 2 + OBSTACLE_MARGIN
      const top = obstacle.center.y + obstacle.height / 2 + OBSTACLE_MARGIN
      const bottom = obstacle.center.y - obstacle.height / 2 - OBSTACLE_MARGIN

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

const OBSTACLE_MARGIN = 0.15
function isGridWalkable(x: number, y: number, obstacles: Obstacle[]): boolean {
  for (const obstacle of obstacles) {
    if (obstacle.type === "rect") {
      const halfWidth = obstacle.width / 2 + OBSTACLE_MARGIN
      const halfHeight = obstacle.height / 2 + OBSTACLE_MARGIN
      if (
        x >= obstacle.center.x - halfWidth &&
        x <= obstacle.center.x + halfWidth &&
        y >= obstacle.center.y - halfHeight &&
        y <= obstacle.center.y + halfHeight
      ) {
        return false
      }
    }
  }
  return true
}

const GRID_STEP = 0.1
function getNeighbors(
  node: Node,
  input: SimpleRouteJson,
  goalDist: number,
): Node[] {
  const neighbors: Node[] = []
  const distances = directionDistancesToNearestObstacle(node.x, node.y, input)

  const directions = [
    { x: 0, y: 1, distance: distances.top }, // Up
    { x: 1, y: 0, distance: distances.right }, // Right
    { x: 0, y: -1, distance: distances.bottom }, // Down
    { x: -1, y: 0, distance: distances.left }, // Left
  ]

  for (const dir of directions) {
    const step = Math.max(
      GRID_STEP,
      Math.min(GRID_STEP * 20, dir.distance / 2, goalDist / 2),
    )
    const newX = node.x + dir.x * step
    const newY = node.y + dir.y * step

    if (
      newX >= input.bounds.minX &&
      newX <= input.bounds.maxX &&
      newY >= input.bounds.minY &&
      newY <= input.bounds.maxY &&
      isGridWalkable(newX, newY, input.obstacles)
    ) {
      neighbors.push({
        x: newX,
        y: newY,
        f: 0,
        g: 0,
        h: 0,
        parent: null,
      })
    }
  }

  return neighbors
}

function aStar(
  start: Point,
  goal: Point,
  input: SimpleRouteJson,
): Point[] | null {
  const openSet: Node[] = []
  const closedSet: Set<string> = new Set()

  const startNode: Node = { ...start, f: 0, g: 0, h: 0, parent: null }
  openSet.push(startNode)

  let iters = 0
  while (openSet.length > 0) {
    iters++
    if (iters > 5000) return null
    openSet.sort((a, b) => a.f - b.f)
    const current = openSet.shift()!

    const goalDist = manhattanDistance(current, goal)
    if (goalDist <= GRID_STEP * 2) {
      const path: Point[] = []
      let node: Node | null = current
      while (node) {
        path.unshift({ x: node.x, y: node.y })
        node = node.parent
      }
      return path
    }

    closedSet.add(`${current.x.toFixed(2)},${current.y.toFixed(2)}`)

    for (const neighbor of getNeighbors(current, input, goalDist)) {
      if (closedSet.has(`${neighbor.x.toFixed(2)},${neighbor.y.toFixed(2)}`))
        continue

      const tentativeG = current.g + GRID_STEP // or +1? not sure

      const existingNeighbor = openSet.find(
        (n) => n.x === neighbor.x && n.y === neighbor.y,
      )

      if (!existingNeighbor || tentativeG < existingNeighbor.g) {
        neighbor.parent = current
        neighbor.g = tentativeG
        neighbor.h = manhattanDistance(neighbor, goal)
        neighbor.f = neighbor.g + neighbor.h

        if (!existingNeighbor) {
          openSet.push(neighbor)
        }
      }
    }
  }

  return null // No path found
}

function routeConnection(
  connection: { name: string; pointsToConnect: Point[] },
  input: SimpleRouteJson,
): SimplifiedPcbTrace {
  const routes: Array<{ x: number; y: number }> = []

  for (let i = 0; i < connection.pointsToConnect.length - 1; i++) {
    const start = connection.pointsToConnect[i]
    const end = connection.pointsToConnect[i + 1]

    // Remove obstacles that are connected to this trace
    const newObstacles = input.obstacles.filter(
      (obstacle) => !obstacle.connectedTo.includes(connection.name),
    )

    const path = aStar(start, end, { ...input, obstacles: newObstacles })

    if (path) {
      routes.push(...path)
    } else {
      console.warn(
        `No path found for connection ${connection.name} between points`,
        start,
        end,
      )
    }
  }

  return {
    type: "pcb_trace",
    pcb_trace_id: connection.name,
    route: routes.map((point) => ({
      route_type: "wire",
      x: point.x,
      y: point.y,
      width: 0.1, // Default width, adjust as needed
      layer: "top", // Default layer, adjust as needed
    })),
  }
}

export function autoroute(soup: AnySoupElement[]): SimplifiedPcbTrace[] {
  const input = getSimpleRouteJson(soup)
  const traces: SimplifiedPcbTrace[] = []

  for (const connection of input.connections) {
    const trace = routeConnection(connection, input)
    traces.push(trace)
  }

  return traces
}
