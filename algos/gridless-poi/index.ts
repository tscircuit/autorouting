import {
  getSimpleRouteJson,
  type SimplifiedPcbTrace,
} from "autorouting-dataset"
import type {
  AnySoupElement,
  PcbFabricationNotePath,
  PcbFabricationNoteText,
} from "@tscircuit/soup"

import { Graph } from "@dagrejs/graphlib"
import { getUnclusteredOptimalPointsFromObstacles } from "./lib/get-unclustered-optimal-points-from-obstacles"
import { constructGraphFromPois } from "./lib/construct-graph-from-pois"
import { getDistanceToSegment } from "./lib/get-distance-to-segment"
import Debug from "debug"
import { Timer } from "../../module/lib/solver-utils/timer"
import { constructGraphFromPoisWithQuadtree } from "./lib/construct-graph-from-pois-quadtree"

const debug = Debug("autorouting-dataset:gridless-poi")

export function autoroute(soup: AnySoupElement[]): SimplifiedPcbTrace[] {
  const timer = new Timer({ logOnEnd: debug.enabled })
  timer.start("getSimpleRouteJson")
  const input = getSimpleRouteJson(soup)
  timer.end()
  const solution: (SimplifiedPcbTrace | PcbFabricationNotePath)[] = []

  // Get optimal points
  timer.start("getUnclusteredOptimalPointsFromObstacles")
  const optimalPoints = getUnclusteredOptimalPointsFromObstacles(
    input.obstacles,
    0.2,
  )
  timer.end()

  if (debug.enabled) {
    solution.push(
      ...optimalPoints.map((point) => ({
        type: "pcb_fabrication_note_path" as const,
        pcb_component_id: "",
        fabrication_note_path_id: `note_path_${point.x}_${point.y}`,
        layer: "top" as const,
        route: [
          [-0.1, 0],
          [0, 0.1],
          [0.1, 0],
          [0, -0.1],
          [-0.1, 0],
        ].map(([dx, dy]) => ({
          x: point.x + dx,
          y: point.y + dy,
        })),
        stroke_width: 0.01,
      })),
    )
  }

  // Construct graph from optimal points
  timer.start("constructGraphFromPois")
  const G = constructGraphFromPoisWithQuadtree(
    optimalPoints,
    input.obstacles as any,
  )
  timer.end()

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

  return solution as any
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
