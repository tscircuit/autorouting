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
import Debug from "debug"

const debug = Debug("autorouting-dataset:infinite-grid-ijump-astar")

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
  /** Distance from the parent node */
  distFromParent: number
  numParents: number
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
const FAST_STEP = 2
const EXTRA_STEP_PENALTY = 0.3
const AXIS_LOCK_ESCAPE_STEP = 0.5
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

  const subDirections: Array<{
    x: number
    y: number
    distance: number
    step: number
    stepX: number
    stepY: number
  }> = []
  for (const dir of directions) {
    const baseStep = clamp(GRID_STEP, MAX_STEP, dir.distance - GRID_STEP)
    const stepX = clamp(minStepX, maxStepX, baseStep * dir.x)
    const stepY = clamp(minStepY, maxStepY, baseStep * dir.y)

    const stepDist = (stepX ** 2 + stepY ** 2) ** 0.5

    subDirections.push({
      x: dir.x,
      y: dir.y,
      distance: dir.distance,
      step: baseStep,
      stepX,
      stepY,
    })

    // If we're stepping greater than FAST_STEP, add a neighbor inbetween, this
    // breaks up large steps (TODO, we should really break into d/FAST_STEP
    // segments)
    if (stepDist > FAST_STEP) {
      const halfStepX = clamp(minStepX, maxStepX, stepX * 0.5)
      const halfStepY = clamp(minStepY, maxStepY, stepY * 0.5)

      subDirections.push({
        x: dir.x,
        y: dir.y,
        distance: dir.distance,
        step: baseStep / 2,
        stepX: halfStepX,
        stepY: halfStepY,
      })
    }

    // "axis lock" happens when we're close to the goal on one axis but not the
    // other, we want to add a neighbor that's a more distant step to
    // avoid slowly exploring
    if (dir.distance > FAST_STEP && stepDist <= GRID_STEP * 1.5) {
      const fastStepX = stepX * (AXIS_LOCK_ESCAPE_STEP / GRID_STEP)
      const fastStepY = stepY * (AXIS_LOCK_ESCAPE_STEP / GRID_STEP)

      subDirections.push({
        x: dir.x,
        y: dir.y,
        distance: dir.distance,
        step: baseStep,
        stepX: fastStepX,
        stepY: fastStepY,
      })
    }
  }

  for (const dir of subDirections) {
    const { stepX, stepY } = dir

    const newX = node.x + stepX
    const newY = node.y + stepY

    if (
      newX >= input.bounds.minX &&
      newX <= input.bounds.maxX &&
      newY >= input.bounds.minY &&
      newY <= input.bounds.maxY &&
      isGridWalkable(newX, newY, input.obstacles)
    ) {
      const distFromParent = (stepX ** 2 + stepY ** 2) ** 0.5
      neighbors.push({
        x: newX,
        y: newY,
        distFromParent,
        numParents: 0,
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

  const startNode: Node = {
    ...start,
    distFromParent: 0,
    f: 0,
    g: 0,
    h: 0,
    numParents: 0,
    parent: null,
  }
  openSet.push(startNode)

  let iters = 0
  while (openSet.length > 0) {
    iters++
    if (iters > 2000) {
      console.log("ITERATIONS MAXED OUT")
      return null
    }
    let debugSolution: Array<PcbFabricationNoteText | PcbFabricationNotePath>
    if (debug.enabled) {
      const debugGroupNum = Math.floor(iters / 10)
      const debugGroup = `iter${debugGroupNum * 10}_${(debugGroupNum + 1) * 10}`
      debugSolutions[debugGroup] ??= []
      debugSolution = debugSolutions[debugGroup]
    }

    // TODO priority queue instead of constant resort
    openSet.sort((a, b) => a.f - b.f)
    const current = openSet.shift()!

    if (debug.enabled) {
      debugSolution!.push({
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
      if (current.parent) {
        debugSolution!.push({
          type: "pcb_fabrication_note_path",
          pcb_component_id: "",
          fabrication_note_path_id: `note_path_${current.x}_${current.y}`,
          layer: "top",
          route: [
            {
              x: current.x,
              y: current.y,
            },
            {
              x: current.parent.x,
              y: current.parent.y,
            },
          ],
          stroke_width: 0.01,
        })
      }
    }

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

    closedSet.add(`${current.x.toFixed(1)},${current.y.toFixed(1)}`)

    for (const neighbor of getNeighbors(current, goal, input)) {
      if (closedSet.has(`${neighbor.x.toFixed(1)},${neighbor.y.toFixed(1)}`))
        continue

      // TODO check distance when adding g
      const tentativeG =
        current.g + EXTRA_STEP_PENALTY + neighbor.distFromParent // manhattanDistance(current, neighbor) // neighbor.distFromParent // GRID_STEP

      const existingNeighbor = openSet.find(
        (n) => n.x === neighbor.x && n.y === neighbor.y,
      )

      if (!existingNeighbor || tentativeG < existingNeighbor.g) {
        neighbor.parent = current
        neighbor.g = tentativeG
        // neighbor.h = dist(neighbor, goal)
        neighbor.h = manhattanDistance(neighbor, goal)
        neighbor.f = neighbor.g + neighbor.h
        neighbor.numParents = current.numParents + 1

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
  if (debug.enabled) {
    for (const key in debugSolutions) {
      delete debugSolutions[key]
    }
  }
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
