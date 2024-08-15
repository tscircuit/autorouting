import type { AnySoupElement } from "@tscircuit/soup"
import { FastObstacleList } from "./FastObstacleList"
import type { Node, Point } from "./types"
import { manDist, nodeName } from "./util"

import Debug from "debug"
import type {
  Obstacle,
  SimpleRouteConnection,
  SimpleRouteJson,
  SimplifiedPcbTrace,
} from "autorouting-dataset"
import { getObstaclesFromRoute } from "./getObstaclesFromRoute"

const debug = Debug("autorouting-dataset:astar")

export type ConnectionSolveResult =
  | { solved: false; connectionName: string }
  | { solved: true; connectionName: string; route: Point[] }

export class GeneralizedAstarAutorouter {
  openSet: Node[] = []
  closedSet: Set<string> = new Set()

  debugSolutions?: Record<string, AnySoupElement[]>
  debugMessage: string | null = null
  debugTraceCount: number = 0

  input: SimpleRouteJson
  obstacles?: FastObstacleList
  allObstacles: Obstacle[]
  startNode?: Node
  goalPoint?: Point
  GRID_STEP: number
  MAX_ITERATIONS: number

  iterations: number = -1

  constructor(opts: {
    input: SimpleRouteJson
    startNode?: Node
    goalPoint?: Point
    GRID_STEP?: number
    MAX_ITERATIONS?: number
  }) {
    this.input = opts.input
    this.allObstacles = opts.input.obstacles
    this.startNode = opts.startNode
    this.goalPoint = opts.goalPoint
    this.GRID_STEP = opts.GRID_STEP ?? 0.1
    this.MAX_ITERATIONS = opts.MAX_ITERATIONS ?? 100

    if (debug.enabled) {
      this.debugSolutions = {}
      this.debugMessage = ""
    }
  }

  /**
   * Return points of interest for this node. Don't worry about checking if
   * points are already visited. You must check that these neighbors are valid
   * (not inside an obstacle)
   *
   * In a simple grid, this is just the 4 neighbors surrounding the node.
   *
   * In ijump-astar, this is the 2-4 surrounding intersections
   */
  getNeighbors(node: Node): Array<Point> {
    return []
  }

  isSameNode(a: Point, b: Point): boolean {
    return manDist(a, b) < this.GRID_STEP
  }

  /**
   * Compute the cost of this path. In normal astar, this is just the length of
   * the path, but you can override this term to penalize paths that are more
   * complex.
   */
  computeG(current: Node, neighbor: Point): number {
    return current.g + manDist(current, neighbor)
  }

  solveOneStep(): {
    solved: boolean
    current: Node
    newNeighbors: Node[]
  } {
    this.iterations += 1
    const { openSet, closedSet, GRID_STEP } = this
    openSet.sort((a, b) => a.f - b.f)

    const current = openSet.shift()!
    const goalDist = manDist(current, this.goalPoint!)
    if (goalDist <= GRID_STEP * 2) {
      return {
        solved: true,
        current,
        newNeighbors: [],
      }
    }

    this.closedSet.add(nodeName(current))

    let newNeighbors: Node[] = []
    for (const neighbor of this.getNeighbors(current)) {
      if (closedSet.has(nodeName(neighbor))) continue

      const tentativeG = this.computeG(current, neighbor)

      const existingNeighbor = this.openSet.find((n) =>
        this.isSameNode(n, neighbor),
      )

      if (!existingNeighbor || tentativeG < existingNeighbor.g) {
        const h = manDist(neighbor, this.goalPoint!)

        const f = tentativeG + h

        const neighborNode: Node = {
          ...neighbor,
          g: tentativeG,
          h,
          f,
          manDistFromParent: manDist(current, neighbor), // redundant compute...
          nodesInPath: current.nodesInPath + 1,
          parent: current,
        }

        openSet.push(neighborNode)
        newNeighbors.push(neighborNode)
      }
    }

    if (debug.enabled) {
      openSet.sort((a, b) => a.f - b.f)
      this.drawDebugSolution({ current, newNeighbors })
    }

    return {
      solved: false,
      current,
      newNeighbors,
    }
  }

  solveConnection(connection: SimpleRouteConnection): ConnectionSolveResult {
    if (connection.pointsToConnect.length > 2) {
      throw new Error(
        "GeneralizedAstarAutorouter doesn't currently support 2+ points in a connection",
      )
    }

    this.startNode = {
      x: connection.pointsToConnect[0].x,
      y: connection.pointsToConnect[0].y,
      manDistFromParent: 0,
      f: 0,
      g: 0,
      h: 0,
      nodesInPath: 0,
      parent: null,
    }

    this.goalPoint =
      connection.pointsToConnect[connection.pointsToConnect.length - 1]

    while (this.iterations < this.MAX_ITERATIONS) {
      const { solved, current } = this.solveOneStep()

      const route: Point[] = []
      let node: Node | null = current
      while (node) {
        route.unshift({ x: node.x, y: node.y })
        node = node.parent
      }

      if (debug.enabled) {
        this.debugMessage += `t${this.debugTraceCount}: ${this.iterations} iterations\n`
      }

      return { solved: true, route, connectionName: connection.name }
    }

    return { solved: false, connectionName: connection.name }
  }

  /**
   * By default, this will solve the connections in the order they are given,
   * and add obstacles for each successfully solved connection. Override this
   * to implement "rip and replace" rerouting strategies.
   */
  solve(): ConnectionSolveResult[] {
    const solutions: ConnectionSolveResult[] = []
    const obstaclesFromTraces: Obstacle[] = []
    for (const connection of this.input.connections) {
      this.obstacles = new FastObstacleList(
        this.allObstacles
          .filter((obstacle) => !obstacle.connectedTo.includes(connection.name))
          .concat(obstaclesFromTraces),
      )
      const result = this.solveConnection(connection)
      solutions.push(result)
      if (result.solved) {
        solutions.push(result)
        obstaclesFromTraces.push(
          ...getObstaclesFromRoute(result.route, connection.name),
        )
      }
    }

    return solutions
  }

  solveAndMapToTraces(): SimplifiedPcbTrace[] {
    const solutions = this.solve()

    return solutions.flatMap((solution) => {
      if (!solution.solved) return []
      return [
        {
          type: "pcb_trace",
          pcb_trace_id: `pcb_trace_for_${solution.connectionName}`,
          route: solution.route.map((point) => ({
            route_type: "wire",
            x: point.x,
            y: point.y,
            width: 0.1, // TODO use configurable width
            layer: "top", // Default layer, adjust as needed
          })),
        },
      ]
    })
  }

  drawDebugSolution({
    current,
    newNeighbors,
  }: {
    current: Node
    newNeighbors: Node[]
  }) {
    const { openSet, debugTraceCount, debugSolutions } = this
    const debugGroup = `t${debugTraceCount}_iter[${this.iterations - 1}]`

    debugSolutions![debugGroup] ??= []
    const debugSolution = debugSolutions![debugGroup]!

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
