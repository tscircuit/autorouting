import {
  getSimpleRouteJson,
  type SolutionWithDebugInfo,
  type SimplifiedPcbTrace,
} from "solver-utils"
import type {
  AnyCircuitElement,
  PcbFabricationNotePath,
  PcbFabricationNoteText,
} from "circuit-json"

import { Graph } from "@dagrejs/graphlib"
import { getUnclusteredOptimalPointsFromObstacles } from "./lib/get-unclustered-optimal-points-from-obstacles"
import { constructGraphFromPois } from "./lib/construct-graph-from-pois"
import { getDistanceToSegment } from "./lib/get-distance-to-segment"
import Debug from "debug"
import { Timer } from "../../module/lib/solver-utils/timer"
import { constructGraphFromPoisWithQuadtree } from "./lib/construct-graph-from-pois-quadtree"
import { constructGraphFromPoisWithDelaunay } from "./lib/construct-graph-from-pois-quadtree-mesh"

const debug = Debug("autorouting-dataset:gridless-poi")

export function autoroute(soup: AnyCircuitElement[]): SolutionWithDebugInfo {
  const timer = new Timer({ logOnEnd: debug.enabled })

  timer.start("getSimpleRouteJson")
  const input = getSimpleRouteJson(soup)
  timer.end()

  const solution: (SimplifiedPcbTrace | PcbFabricationNotePath)[] = []
  const debugSolutions: Record<string, AnyCircuitElement[]> = {
    mesh: [],
    pois: [],
  }

  // Get optimal points
  timer.start("getUnclusteredOptimalPointsFromObstacles")
  const optimalPoints = getUnclusteredOptimalPointsFromObstacles(
    input.obstacles,
    0.2,
  )
  timer.end()

  if (debug.enabled) {
    debugSolutions.pois.push(
      ...optimalPoints.map((point) => ({
        type: "pcb_fabrication_note_path" as const,
        pcb_component_id: "",
        pcb_fabrication_note_path_id: `note_path_${point.x}_${point.y}`,
        layer: "top" as const,
        route: [
          [-0.04, 0],
          [0, 0.04],
          [0.04, 0],
          [0, -0.04],
          [-0.04, 0],
        ].map(([dx, dy]) => ({
          x: point.x + dx,
          y: point.y + dy,
        })),
        stroke_width: 0.03,
      })),
    )
  }

  // Construct graph from optimal points
  timer.start("constructGraphFromPois")
  const G = constructGraphFromPoisWithDelaunay(
    optimalPoints,
    input.obstacles as any,
  )
  timer.end()

  if (debug.enabled) {
    // Iterate over the graph and add a "fabrication_note_path" for each edge
    for (const edge of G.edges()) {
      const [source, target] = [edge.v, edge.w]
      const sourceNode = G.node(source)
      const targetNode = G.node(target)
      debugSolutions.mesh.push({
        type: "pcb_fabrication_note_path",
        pcb_component_id: "",
        pcb_fabrication_note_path_id: `note_path_${sourceNode.x}_${sourceNode.y}_${targetNode.x}_${targetNode.y}`,
        layer: "top" as const,
        route: [
          {
            x: sourceNode.x,
            y: sourceNode.y,
          },
          {
            x: targetNode.x,
            y: targetNode.y,
          },
        ],
        stroke_width: 0.01,
      })
    }
  }

  // Add start and end points for each connection
  timer.start("add start and end points for each connection")
  input.connections.forEach((connection, index) => {
    const startNodeId = `START_${index}`
    const endNodeId = `END_${index}`

    G.setNode(startNodeId, connection.pointsToConnect[0])
    G.setNode(
      endNodeId,
      connection.pointsToConnect[connection.pointsToConnect.length - 1],
    )

    // Connect start and end to nearby optimal points
    optimalPoints.forEach((point, i) => {
      const startDist = Math.hypot(
        point.x - connection.pointsToConnect[0].x,
        point.y - connection.pointsToConnect[0].y,
      )
      const endDist = Math.hypot(
        point.x -
          connection.pointsToConnect[connection.pointsToConnect.length - 1].x,
        point.y -
          connection.pointsToConnect[connection.pointsToConnect.length - 1].y,
      )

      // TODO, if the optimal point was generated from an obstacle that was
      // connected to the start/end, we should just mark it as connected
      // without doing any distance measurements
      if (startDist < 1) {
        G.setEdge(startNodeId, i.toString(), { d: startDist })
      }
      if (endDist < 1) {
        G.setEdge(i.toString(), endNodeId, { d: endDist })
      }
    })
    timer.end()

    // Find optimal path
    timer.start("findOptimalPath")
    const optPath = findOptimalPath(G, startNodeId, endNodeId)
    timer.end()

    if (optPath) {
      const route: SimplifiedPcbTrace["route"] = optPath.path.map(
        (nodeName) => {
          const point = G.node(nodeName)
          return {
            route_type: "wire",
            x: point.x,
            y: point.y,
            width: 0.08,
            layer: "top",
          }
        },
      )

      solution.push({
        type: "pcb_trace",
        pcb_trace_id: `pcb_trace_for_${connection.name}`,
        route,
      })
    }
  })

  return { solution, debugSolutions }
}

function findOptimalPath(G: Graph, startNode: string, endNode: string) {
  const queue = [[startNode]]
  const visited = new Set()

  while (queue.length > 0) {
    const path = queue.shift()
    if (!path) break

    const node = path[path.length - 1]

    if (node === endNode) {
      return {
        path: path,
        distance: calculatePathDistance(G, path),
      }
    }

    if (!visited.has(node)) {
      visited.add(node)

      const neighbors = G.nodeEdges(node) || []
      for (const edge of neighbors) {
        const neighborNode = edge.v === node ? edge.w : edge.v
        if (!visited.has(neighborNode)) {
          queue.push([...path, neighborNode])
        }
      }
    }
  }

  return null // No path found
}

function calculatePathDistance(G: Graph, path: string[]) {
  let totalDistance = 0
  for (let i = 0; i < path.length - 1; i++) {
    const edge = G.edge(path[i], path[i + 1])
    totalDistance += edge.d
  }
  return totalDistance
}
