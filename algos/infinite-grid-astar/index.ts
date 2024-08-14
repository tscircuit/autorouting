import {
  getSimpleRouteJson,
  type SimplifiedPcbTrace,
  type Obstacle,
  type SimpleRouteJson,
} from "autorouting-dataset"
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
    } else if (obstacle.type === "oval") {
      // Simplified oval check (treating it as a circle)
      const dx = x - obstacle.center.x
      const dy = y - obstacle.center.y
      const radius =
        Math.max(obstacle.width, obstacle.height) / 2 + OBSTACLE_MARGIN
      if (dx * dx + dy * dy <= radius * radius) {
        return false
      }
    }
  }
  return true
}

const GRID_STEP = 0.1
function getNeighbors(node: Node, input: SimpleRouteJson): Node[] {
  const neighbors: Node[] = []
  const directions = [
    { x: 0, y: GRID_STEP },
    { x: GRID_STEP, y: 0 },
    { x: 0, y: -GRID_STEP },
    { x: -GRID_STEP, y: 0 },
  ]

  for (const dir of directions) {
    const newX = node.x + dir.x
    const newY = node.y + dir.y

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

  while (openSet.length > 0) {
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

    closedSet.add(`${current.x},${current.y}`)

    for (const neighbor of getNeighbors(current, input)) {
      if (closedSet.has(`${neighbor.x},${neighbor.y}`)) continue

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
