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

let debugGroup: string | null = null
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
  return ((a.x - b.x) ** 2 + (a.y - b.y) ** 2) ** 0.5
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

// TODO implement getLargestObstacleAt in case of overlap, sometimes we care
// about obstacle that goes the highest Y, lowest Y, leftmost/rightmost etc.
function getObstacleAt(
  x: number,
  y: number,
  obstacles: Obstacle[],
): Obstacle | null {
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
        return obstacle
      }
    }
  }
  return null
}

const GRID_STEP = 0.1
const FAST_STEP = 2
const EXTRA_STEP_PENALTY = 1
const MAX_STEP = 100
/**
 * The higher the heuristic distance penalty, the more likely we are to explore
 * paths that are closer to the goal. Making this number 1 will give us shorter
 * paths, but often sacrificing speed. Making it higher than 1 will make it go
 * down more rabbitholes, but in most cases find a path faster.
 */
const HEURISTIC_PENALTY_MULTIPLIER = 3

// Still validating this, see https://github.com/tscircuit/autorouting-dataset/issues/28
const SHOULD_IGNORE_SMALL_UNNECESSARY_BACKSTEPS = true

function getNeighbors(node: Node, goal: Point, input: SimpleRouteJson): Node[] {
  const neighbors: Node[] = []
  const distances = directionDistancesToNearestObstacle(node.x, node.y, input)

  const remainingGoalDist = {
    x: goal.x - node.x,
    y: goal.y - node.y,
  }

  const parentDir = {
    x: node.parent ? Math.sign(node.parent.x - node.x) : 0,
    y: node.parent ? Math.sign(node.parent.y - node.y) : 0,
    distance: node.parent ? manhattanDistance(node.parent, node) : 0,
  }

  const goalUnitD: {
    x: number
    y: number
    dirX: "left" | "right"
    dirY: "top" | "bottom"
  } = {
    x: Math.sign(remainingGoalDist.x),
    y: Math.sign(remainingGoalDist.y),
    dirX: remainingGoalDist.x > 0 ? "right" : "left",
    dirY: remainingGoalDist.y > 0 ? "top" : "bottom",
  }

  const directions: Array<{
    x: number
    y: number
    distance: number
    maxOrthoDist: number
    orthoDir: { x: number; y: number; distance: number }
  }> = [
    // Up
    {
      x: 0,
      y: 1,
      distance: distances.top,
      maxOrthoDist: Math.max(distances.left, distances.right),
      orthoDir: { x: goalUnitD.x, y: 0, distance: distances[goalUnitD.dirX] },
    },
    // Right
    {
      x: 1,
      y: 0,
      distance: distances.right,
      maxOrthoDist: Math.max(distances.top, distances.bottom),
      orthoDir: { x: 0, y: goalUnitD.y, distance: distances[goalUnitD.dirY] },
    },
    // Down
    {
      x: 0,
      y: -1,
      distance: distances.bottom,
      maxOrthoDist: Math.max(distances.left, distances.right),
      orthoDir: { x: goalUnitD.x, y: 0, distance: distances[goalUnitD.dirX] },
    },
    // Left
    {
      x: -1,
      y: 0,
      distance: distances.left,
      maxOrthoDist: Math.max(distances.top, distances.bottom),
      orthoDir: { x: 0, y: goalUnitD.y, distance: distances[goalUnitD.dirY] },
    },
    // { x: 1, y: 1, distance: distances.topRight }, // Top-Right
    // { x: -1, y: 1, distance: distances.topLeft }, // Top-Left
    // { x: 1, y: -1, distance: distances.bottomRight }, // Bottom-Right
    // { x: -1, y: -1, distance: distances.bottomLeft }, // Bottom-Left
  ]

  const minBStepX = Math.min(remainingGoalDist.x, -GRID_STEP)
  const maxBStepX = Math.max(remainingGoalDist.x, GRID_STEP)
  const minBStepY = Math.min(remainingGoalDist.y, -GRID_STEP)
  const maxBStepY = Math.max(remainingGoalDist.y, GRID_STEP)

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

    const bStepX = clamp(minBStepX, maxBStepX, baseStep * dir.x)
    const bStepY = clamp(minBStepY, maxBStepY, baseStep * dir.y)

    const stepDist = (bStepX ** 2 + bStepY ** 2) ** 0.5
    const bStepManDist = Math.abs(bStepX) + Math.abs(bStepY)

    // Each direction has an two orthogonal directions, it can be blocked in those
    // directions, and they can indicate a good sub-direction to take. For example,
    // you might have something like this:
    //
    //         |
    //  G      | C
    //         |
    //
    // Above, if C takes one step up (A), it will still be blocked by the obstacle,
    // but we can compute where the obstacle _ends_ (B), and decide to take two
    // steps up instead of one.
    //           B
    //         | A
    //  G      | C
    //         |
    //
    // So here's what we do to compute B:
    // - Determine the orthogonal direction for C, you have two candidate
    //   direction (left or right), and you choose the one that's closer to the
    //   goal
    // - Determine the orthogonal distance to the wall (use the distances object)
    // - Compute the distance to overcome the obstacle
    // - Set step to overcome the obstacle
    let usedOrthogonalOptimalPlacement = false
    if (
      dir.orthoDir.distance < FAST_STEP + GRID_STEP &&
      dir.distance > FAST_STEP
    ) {
      const { orthoDir } = dir
      const obstacle = getObstacleAt(
        node.x + orthoDir.x * (orthoDir.distance + 0.001),
        node.y + orthoDir.y * (orthoDir.distance + 0.001),
        input.obstacles,
      )

      if (obstacle && obstacle.type === "rect") {
        let distToOvercomeObstacle: number
        if (dir.x === 0) {
          if (dir.y > 0) {
            distToOvercomeObstacle =
              obstacle.center.y + obstacle.height / 2 - node.y
          } else {
            distToOvercomeObstacle =
              node.y - (obstacle.center.y - obstacle.height / 2)
          }
        } else {
          if (dir.x > 0) {
            distToOvercomeObstacle =
              obstacle.center.x + obstacle.width / 2 - node.x
          } else {
            distToOvercomeObstacle =
              node.x - (obstacle.center.x - obstacle.width / 2)
          }
        }
        distToOvercomeObstacle += OBSTACLE_MARGIN + GRID_STEP

        const oStepX = dir.x * distToOvercomeObstacle
        const oStepY = dir.y * distToOvercomeObstacle
        const oStepManDist = Math.abs(oStepX) + Math.abs(oStepY)
        if (oStepManDist > bStepManDist) {
          subDirections.push({
            x: dir.x,
            y: dir.y,
            distance: dir.distance,
            step: distToOvercomeObstacle,
            stepX: dir.x * distToOvercomeObstacle,
            stepY: dir.y * distToOvercomeObstacle,
          })
          usedOrthogonalOptimalPlacement = true
        }
      }
    }

    if (!usedOrthogonalOptimalPlacement) {
      if (SHOULD_IGNORE_SMALL_UNNECESSARY_BACKSTEPS) {
        const isSmallStep = bStepManDist <= GRID_STEP
        const isEscapingSmallSpace = dir.maxOrthoDist < FAST_STEP
        const isBackstep = dir.x === parentDir.x && dir.y === parentDir.y

        if (isSmallStep && !isEscapingSmallSpace && isBackstep) {
          continue
        }
      }
      subDirections.push({
        x: dir.x,
        y: dir.y,
        distance: dir.distance,
        step: baseStep,
        stepX: bStepX,
        stepY: bStepY,
      })
    }

    // If we're stepping greater than FAST_STEP, add a neighbor inbetween, this
    // breaks up large steps (TODO, we should really break into d/FAST_STEP
    // segments)
    if (stepDist > FAST_STEP) {
      const halfStepX = clamp(minBStepX, maxBStepX, bStepX * 0.5)
      const halfStepY = clamp(minBStepY, maxBStepY, bStepY * 0.5)

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
    // if (dir.distance > FAST_STEP && stepDist <= GRID_STEP * 1.5) {
    //   const fastStepX = stepX * (AXIS_LOCK_ESCAPE_STEP / GRID_STEP)
    //   const fastStepY = stepY * (AXIS_LOCK_ESCAPE_STEP / GRID_STEP)

    //   subDirections.push({
    //     x: dir.x,
    //     y: dir.y,
    //     distance: dir.distance,
    //     step: baseStep,
    //     stepX: fastStepX,
    //     stepY: fastStepY,
    //   })
    // }
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
    let debugSolution: Array<
      PcbFabricationNoteText | PcbFabricationNotePath
    > | null = null
    if (debug.enabled) {
      const groupSize = 1
      const debugGroupNum = Math.floor((iters - 1) / groupSize)
      // No more than 10 groups to avoid massive output
      if (debugGroupNum < 10) {
        debugGroup = `iter${debugGroupNum * groupSize}_${(debugGroupNum + 1) * groupSize}`
        debugSolutions[debugGroup] ??= []
        debugSolution = debugSolutions[debugGroup]
      } else {
        debugGroup = null
      }
    }

    // TODO priority queue instead of constant resort
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
      if (debug.enabled) {
        console.log(`Path found after ${iters} iterations`)
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
        neighbor.h =
          manhattanDistance(neighbor, goal) * HEURISTIC_PENALTY_MULTIPLIER
        neighbor.f = neighbor.g + neighbor.h
        neighbor.numParents = current.numParents + 1

        if (!existingNeighbor) {
          openSet.push(neighbor)
        }
      }
    }

    if (debug.enabled && debugSolution) {
      // Redundant sort, but much better for debugging
      openSet.sort((a, b) => a.f - b.f)
      debugSolution.push({
        type: "pcb_fabrication_note_text",
        font: "tscircuit2024",
        font_size: 0.25,
        text: "X",
        pcb_component_id: "",
        layer: "top",
        anchor_position: {
          x: current.x,
          y: current.y,
        },
        anchor_alignment: "center",
      })
      // Add all the openSet as small diamonds
      for (let i = 0; i < openSet.length; i++) {
        const node = openSet[i]
        debugSolution.push({
          type: "pcb_fabrication_note_path",
          pcb_component_id: "",
          fabrication_note_path_id: `note_path_${node.x}_${node.y}`,
          layer: "top",
          route: [
            [0, 0.1],
            [0.1, 0],
            [0, -0.1],
            [-0.1, 0],
            [0, 0.1],
          ].map(([dx, dy]) => ({
            x: node.x + dx,
            y: node.y + dy,
          })),
          stroke_width: 0.02,
        })
        // Add text that indicates the order of this point
        debugSolution.push({
          type: "pcb_fabrication_note_text",
          font: "tscircuit2024",
          font_size: 0.1,
          text: i.toString(),
          pcb_component_id: "",
          layer: "top",
          anchor_position: {
            x: node.x,
            y: node.y,
          },
          anchor_alignment: "center",
        })
      }

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
    debugGroup = null
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
