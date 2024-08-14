import {
  getSimpleRouteJson,
  type SimplifiedPcbTrace,
  type Obstacle,
  type SimpleRouteJson,
} from "autorouting-dataset"
import type {
  AnySoupElement,
  PcbFabricationNotePath,
  PcbFabricationNoteText,
} from "@tscircuit/soup"
import type { SolutionWithDebugInfo } from "autorouting-dataset/lib/solver-utils/ProblemSolver"

const debugSolutions: any = {}

const clamp = (min: number, max: number, value: number) => {
  return Math.min(Math.max(min, value), max)
}

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

function dist(a: Point, b: Point): number {
  return (a.x - b.x ** 2 + (a.y - b.y) ** 2) ** 0.5
}

function diagonalDistance(a: Point, b: Point): number {
  const dx = Math.abs(a.x - b.x)
  const dy = Math.abs(a.y - b.y)
  return Math.max(dx, dy)
}

interface DirectionDistances {
  left: number
  top: number
  bottom: number
  right: number
  topLeft: number
  topRight: number
  bottomLeft: number
  bottomRight: number
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
    topLeft: Infinity,
    topRight: Infinity,
    bottomLeft: Infinity,
    bottomRight: Infinity,
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

      if (x < left && y < bottom) {
        result.topLeft = Math.min(
          result.topLeft,
          diagonalDistance({ x, y }, { x: left, y: bottom }),
        )
      }
      if (x > right && y < bottom) {
        result.topRight = Math.min(
          result.topRight,
          diagonalDistance({ x, y }, { x: right, y: bottom }),
        )
      }
      if (x < left && y > top) {
        result.bottomLeft = Math.min(
          result.bottomLeft,
          diagonalDistance({ x, y }, { x: left, y: top }),
        )
      }
      if (x > right && y > top) {
        result.bottomRight = Math.min(
          result.bottomRight,
          diagonalDistance({ x, y }, { x: right, y: top }),
        )
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
const MAX_STEP = 100
function getNeighbors(node: Node, goal: Point, input: SimpleRouteJson): Node[] {
  const neighbors: Node[] = []
  const distances = directionDistancesToNearestObstacle(node.x, node.y, input)

  const directions = [
    { x: 0, y: 1, distance: distances.top }, // Up
    { x: 1, y: 0, distance: distances.right }, // Right
    { x: 0, y: -1, distance: distances.bottom }, // Down
    { x: -1, y: 0, distance: distances.left }, // Left
    // { x: 1, y: 1, distance: distances.topRight }, // Top-Right
    // { x: -1, y: 1, distance: distances.topLeft }, // Top-Left
    // { x: 1, y: -1, distance: distances.bottomRight }, // Bottom-Right
    // { x: -1, y: -1, distance: distances.bottomLeft }, // Bottom-Left
  ]

  const remainingGoalDist = {
    x: goal.x - node.x,
    y: goal.y - node.y,
  }

  const minStepX = Math.min(remainingGoalDist.x, -GRID_STEP)
  const maxStepX = Math.max(remainingGoalDist.x, GRID_STEP)
  const minStepY = Math.min(remainingGoalDist.y, -GRID_STEP)
  const maxStepY = Math.max(remainingGoalDist.y, GRID_STEP)

  console.log("minStepX:", minStepX.toFixed(2))
  console.log("maxStepX:", maxStepX.toFixed(2))
  console.log("minStepY:", minStepY.toFixed(2))
  console.log("maxStepY:", maxStepY.toFixed(2))

  for (const dir of directions) {
    console.log("\ndir:", dir)
    // const step = Math.min(
    //   GRID_STEP * 20,
    //   Math.max(
    //     GRID_STEP,
    //     dir.distance - GRID_STEP,
    //     // Math.min(GRID_STEP * 20, (dir.distance - GRID_STEP)/2, goalDist / 2),
    //   ),
    // )
    const step = clamp(GRID_STEP, MAX_STEP, dir.distance - GRID_STEP)
    console.log("step:", step.toFixed(2))
    console.log("dir.distance:", dir.distance.toFixed(2))
    const stepX = clamp(minStepX, maxStepX, step * dir.x)
    const stepY = clamp(minStepY, maxStepY, step * dir.y)
    console.log("stepX:", stepX.toFixed(2), "stepY:", stepY.toFixed(2))

    const newX = node.x + stepX
    const newY = node.y + stepY
    console.log("newX:", newX.toFixed(2))
    console.log("newY:", newY.toFixed(2))

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
    console.log("\nITERATIONS:", iters)
    if (iters > 10) {
      console.log("ITERATIONS MAXED OUT")
      return null
    }
    const debugGroup = Math.floor(iters / 10)
    debugSolutions[`iter${debugGroup * 10}`] ??= []
    const debugSolution: Array<PcbFabricationNoteText> =
      debugSolutions[`iter${debugGroup * 10}`]
    openSet.sort((a, b) => a.f - b.f)
    const current = openSet.shift()!

    debugSolution.push({
      type: "pcb_fabrication_note_text",
      font: "tscircuit2024",
      font_size: 0.1,
      text: iters.toString(),
      pcb_component_id: "",
      layer: "top",
      anchor_position: {
        x: current.x,
        y: current.y,
      },
      anchor_alignment: "center",
    })

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

    for (const neighbor of getNeighbors(current, goal, input)) {
      if (closedSet.has(`${neighbor.x.toFixed(2)},${neighbor.y.toFixed(2)}`))
        continue

      // TODO check distance when adding g
      const tentativeG = current.g + GRID_STEP

      const existingNeighbor = openSet.find(
        (n) => n.x === neighbor.x && n.y === neighbor.y,
      )

      if (!existingNeighbor || tentativeG < existingNeighbor.g) {
        neighbor.parent = current
        neighbor.g = tentativeG
        // neighbor.h = dist(neighbor, goal)
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

export function autoroute(soup: AnySoupElement[]): SolutionWithDebugInfo {
  const input = getSimpleRouteJson(soup)
  const traces: SimplifiedPcbTrace[] = []

  for (const connection of input.connections) {
    const trace = routeConnection(connection, input)
    traces.push(trace)
  }

  return {
    solution: traces,
    debugSolutions,
  }
}
