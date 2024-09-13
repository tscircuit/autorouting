import type { AnySoupElement, LayerRef, PCBSMTPad } from "@tscircuit/soup"
// import { QuadtreeObstacleList } from "./QuadtreeObstacleList"
import type { Node, Point, PointWithObstacleHit } from "./types"
import { manDist, nodeName } from "./util"

import Debug from "debug"
import type {
  Obstacle,
  SimpleRouteConnection,
  SimpleRouteJson,
  SimplifiedPcbTrace,
} from "autorouting-dataset"
import { getObstaclesFromRoute } from "autorouting-dataset/lib/solver-utils/getObstaclesFromRoute"
import { ObstacleList } from "./ObstacleList"
import { removePathLoops } from "autorouting-dataset/lib/solver-postprocessing/remove-path-loops"
import { addViasWhenLayerChanges } from "autorouting-dataset/lib/solver-postprocessing/add-vias-when-layer-changes"

const debug = Debug("autorouting-dataset:astar")

export interface PointWithLayer extends Point {
  layer: string
}

export type ConnectionSolveResult =
  | { solved: false; connectionName: string }
  | { solved: true; connectionName: string; route: PointWithLayer[] }

export class GeneralizedAstarAutorouter {
  openSet: Node[] = []
  closedSet: Set<string> = new Set()
  debug = false

  debugSolutions?: Record<string, AnySoupElement[]>
  debugMessage: string | null = null
  debugTraceCount: number = 0

  input: SimpleRouteJson
  obstacles?: ObstacleList
  allObstacles: Obstacle[]
  startNode?: Node
  goalPoint?: Point & { l: number }
  GRID_STEP: number
  OBSTACLE_MARGIN: number
  MAX_ITERATIONS: number
  isRemovePathLoopsEnabled: boolean
  /**
   * Setting this greater than 1 makes the algorithm find suboptimal paths and
   * act more greedy, but at greatly improves performance.
   *
   * Recommended value is between 1.1 and 1.5
   */
  GREEDY_MULTIPLIER = 1.1

  iterations: number = -1

  constructor(opts: {
    input: SimpleRouteJson
    startNode?: Node
    goalPoint?: Point
    GRID_STEP?: number
    OBSTACLE_MARGIN?: number
    MAX_ITERATIONS?: number
    isRemovePathLoopsEnabled?: boolean
    debug?: boolean
  }) {
    this.input = opts.input
    this.allObstacles = opts.input.obstacles
    this.startNode = opts.startNode
    this.goalPoint = opts.goalPoint
      ? ({ l: 0, ...opts.goalPoint } as any)
      : undefined
    this.GRID_STEP = opts.GRID_STEP ?? 0.1
    this.OBSTACLE_MARGIN = opts.OBSTACLE_MARGIN ?? 0.15
    this.MAX_ITERATIONS = opts.MAX_ITERATIONS ?? 100
    this.debug = opts.debug ?? debug.enabled
    this.isRemovePathLoopsEnabled = opts.isRemovePathLoopsEnabled ?? false
    if (this.debug) {
      debug.enabled = true
    }

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
  getNeighbors(node: Node): Array<PointWithObstacleHit> {
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

  computeH(node: Point): number {
    return manDist(node, this.goalPoint!)
  }

  getNodeName(node: Point): string {
    return nodeName(node, this.GRID_STEP)
  }

  solveOneStep(): {
    solved: boolean
    current: Node
    newNeighbors: Node[]
  } {
    this.iterations += 1
    const { openSet, closedSet, GRID_STEP, goalPoint } = this
    openSet.sort((a, b) => a.f - b.f)

    const current = openSet.shift()!
    const goalDist = this.computeH(current)
    if (goalDist <= GRID_STEP * 2) {
      return {
        solved: true,
        current,
        newNeighbors: [],
      }
    }

    this.closedSet.add(this.getNodeName(current))

    let newNeighbors: Node[] = []
    for (const neighbor of this.getNeighbors(current)) {
      if (closedSet.has(this.getNodeName(neighbor))) continue

      const tentativeG = this.computeG(current, neighbor)

      const existingNeighbor = this.openSet.find((n) =>
        this.isSameNode(n, neighbor),
      )

      if (!existingNeighbor || tentativeG < existingNeighbor.g) {
        const h = this.computeH(neighbor)

        const f = tentativeG + h * this.GREEDY_MULTIPLIER

        const neighborNode: Node = {
          ...neighbor,
          g: tentativeG,
          h,
          f,
          obstacleHit: neighbor.obstacleHit ?? undefined,
          manDistFromParent: manDist(current, neighbor), // redundant compute...
          nodesInPath: current.nodesInPath + 1,
          parent: current,
          enterMarginCost: neighbor.enterMarginCost,
          travelMarginCostFactor: neighbor.travelMarginCostFactor,
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

  getStartNode(connection: SimpleRouteConnection): Node {
    return {
      x: connection.pointsToConnect[0].x,
      y: connection.pointsToConnect[0].y,
      manDistFromParent: 0,
      f: 0,
      g: 0,
      h: 0,
      nodesInPath: 0,
      parent: null,
    }
  }

  layerToIndex(layer: string): number {
    return 0
  }
  indexToLayer(index: number): string {
    return "top"
  }

  solveConnection(connection: SimpleRouteConnection): ConnectionSolveResult {
    const { pointsToConnect } = connection
    if (pointsToConnect.length > 2) {
      throw new Error(
        "GeneralizedAstarAutorouter doesn't currently support 2+ points in a connection",
      )
    }

    this.iterations = 0
    this.closedSet = new Set()
    this.startNode = this.getStartNode(connection)
    this.goalPoint = {
      ...pointsToConnect[pointsToConnect.length - 1],
      l: this.layerToIndex(pointsToConnect[pointsToConnect.length - 1].layer),
    }
    this.openSet = [this.startNode]

    while (this.iterations < this.MAX_ITERATIONS) {
      const { solved, current } = this.solveOneStep()

      if (solved) {
        let route: PointWithLayer[] = []
        let node: Node | null = current
        while (node) {
          const l: number | undefined = (node as any).l
          route.unshift({
            x: node.x,
            y: node.y,
            // TODO: this layer should be included as part of the node
            layer:
              l !== undefined ? this.indexToLayer(l) : pointsToConnect[0].layer,
          })
          node = node.parent
        }

        if (debug.enabled) {
          this.debugMessage += `t${this.debugTraceCount}: ${this.iterations} iterations\n`
        }

        if (this.isRemovePathLoopsEnabled) {
          route = removePathLoops(route)
        }

        return { solved: true, route, connectionName: connection.name }
      }

      if (this.openSet.length === 0) {
        break
      }
    }

    if (debug.enabled) {
      this.debugMessage += `t${this.debugTraceCount}: ${this.iterations} iterations (failed)\n`
    }

    return { solved: false, connectionName: connection.name }
  }

  createObstacleList({
    dominantLayer,
    connection,
    obstaclesFromTraces,
  }: {
    dominantLayer?: string
    connection: SimpleRouteConnection
    obstaclesFromTraces: Obstacle[]
  }): ObstacleList {
    return new ObstacleList(
      this.allObstacles
        .filter((obstacle) => !obstacle.connectedTo.includes(connection.name))
        // TODO obstacles on different layers should be filtered inside
        // the algorithm, not for the entire connection, this is a hack in
        // relation to https://github.com/tscircuit/tscircuit/issues/432
        .filter((obstacle) => obstacle.layers.includes(dominantLayer as any))
        .concat(obstaclesFromTraces ?? []),
    )
  }

  /**
   * By default, this will solve the connections in the order they are given,
   * and add obstacles for each successfully solved connection. Override this
   * to implement "rip and replace" rerouting strategies.
   */
  solve(): ConnectionSolveResult[] {
    const solutions: ConnectionSolveResult[] = []
    const obstaclesFromTraces: Obstacle[] = []
    this.debugTraceCount = 0
    for (const connection of this.input.connections) {
      const dominantLayer = connection.pointsToConnect[0].layer ?? "top"
      this.debugTraceCount += 1
      this.obstacles = this.createObstacleList({
        dominantLayer,
        connection,
        obstaclesFromTraces,
      })
      const result = this.solveConnection(connection)
      solutions.push(result)

      if (debug.enabled) {
        this.drawDebugTraceObstacles(obstaclesFromTraces)
      }

      if (result.solved) {
        obstaclesFromTraces.push(
          ...getObstaclesFromRoute(
            result.route.map((p) => ({
              x: p.x,
              y: p.y,
              layer: p.layer ?? dominantLayer,
            })),
            connection.name,
          ),
        )
      }
    }

    return solutions
  }

  solveAndMapToTraces(): SimplifiedPcbTrace[] {
    const solutions = this.solve()

    return solutions.flatMap((solution): SimplifiedPcbTrace[] => {
      if (!solution.solved) return []
      return [
        {
          type: "pcb_trace" as const,
          pcb_trace_id: `pcb_trace_for_${solution.connectionName}`,
          route: addViasWhenLayerChanges(
            solution.route.map((point) => ({
              route_type: "wire" as const,
              x: point.x,
              y: point.y,
              width: 0.1, // TODO use configurable width
              layer: point.layer as LayerRef,
            })),
          ),
        },
      ]
    })
  }

  getDebugGroup(): string | null {
    const dgn = `t${this.debugTraceCount}_iter[${this.iterations - 1}]`
    if (this.iterations < 30) return dgn
    if (this.iterations < 100 && this.iterations % 10 === 0) return dgn
    if (this.iterations < 1000 && this.iterations % 100 === 0) return dgn
    if (!this.debugSolutions) return dgn
    return null
  }

  drawDebugTraceObstacles(obstacles: Obstacle[]) {
    const { debugTraceCount, debugSolutions } = this
    for (const key in debugSolutions) {
      if (key.startsWith(`t${debugTraceCount}_`)) {
        debugSolutions[key].push(
          ...obstacles.map(
            (obstacle, i) =>
              ({
                type: "pcb_smtpad",
                pcb_component_id: "",
                layer: obstacle.layers[0],
                width: obstacle.width,
                shape: "rect",
                x: obstacle.center.x,
                y: obstacle.center.y,
                pcb_smtpad_id: `trace_obstacle_${i}`,
                height: obstacle.height,
              }) as PCBSMTPad,
          ),
        )
      }
    }
  }

  drawDebugSolution({
    current,
    newNeighbors,
  }: {
    current: Node
    newNeighbors: Node[]
  }) {
    const debugGroup = this.getDebugGroup()
    if (!debugGroup) return

    const { openSet, debugTraceCount, debugSolutions } = this

    debugSolutions![debugGroup] ??= []
    const debugSolution = debugSolutions![debugGroup]!

    debugSolution.push({
      type: "pcb_fabrication_note_text",
      font: "tscircuit2024",
      font_size: 0.25,
      text: "X" + (current.l !== undefined ? current.l : ""),
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
          [0, 0.05],
          [0.05, 0],
          [0, -0.05],
          [-0.05, 0],
          [0, 0.05],
        ].map(([dx, dy]) => ({
          x: node.x + dx,
          y: node.y + dy,
        })),
        stroke_width: 0.01,
      })
      // Add text that indicates the order of this point
      debugSolution.push({
        type: "pcb_fabrication_note_text",
        font: "tscircuit2024",
        font_size: 0.03,
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
      const path: Node[] = []
      let p: Node | null = current
      while (p) {
        path.unshift(p)
        p = p.parent
      }
      debugSolution!.push({
        type: "pcb_fabrication_note_path",
        pcb_component_id: "",
        fabrication_note_path_id: `note_path_${current.x}_${current.y}`,
        layer: "top",
        route: path,
        stroke_width: 0.01,
      })
    }
  }
}
