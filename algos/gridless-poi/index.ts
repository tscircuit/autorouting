import {
  getSimpleRouteJson,
  type SimplifiedPcbTrace,
} from "autorouting-dataset"
import type { AnySoupElement } from "@tscircuit/soup"

import { Graph } from "@dagrejs/graphlib"
import {
  getSimpleRouteJson,
  type SimplifiedPcbTrace,
} from "autorouting-dataset"
import { getUnclusteredOptimalPointsFromObstacles } from "./get-unclustered-optimal-points-from-obstacles"
import { constructGraphFromOptimalPoints } from "./construct-graph-from-optimal-points"
import { getDistanceToSegment } from "./get-distance-to-segment"

export function autoroute(soup: AnySoupElement[]): SimplifiedPcbTrace[] {
  const input = getSimpleRouteJson(soup)
  const solution: SimplifiedPcbTrace[] = []

  // Convert obstacles to the format expected by getUnclusteredOptimalPointsFromObstacles
  const obstacles = input.obstacles.map((obstacle) => ({
    obstacleType: "line" as const,
    linePoints: [
      {
        x: obstacle.center.x - obstacle.width / 2,
        y: obstacle.center.y - obstacle.height / 2,
      },
      {
        x: obstacle.center.x + obstacle.width / 2,
        y: obstacle.center.y + obstacle.height / 2,
      },
    ],
    width: Math.min(obstacle.width, obstacle.height),
  }))

  // Get optimal points
  const optimalPoints = getUnclusteredOptimalPointsFromObstacles(
    obstacles,
    0.02,
  )

  // Construct graph from optimal points
  const G = constructGraphFromOptimalPoints(optimalPoints, obstacles)

  // Add start and end points for each connection
  input.connections.forEach((connection, index) => {
    const startNode = `START_${index}`
    const endNode = `END_${index}`

    G.setNode(startNode, connection.pointsToConnect[0])
    G.setNode(
      endNode,
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

      if (startDist < 0.1) {
        G.setEdge(startNode, i.toString(), { d: startDist })
      }
      if (endDist < 0.1) {
        G.setEdge(i.toString(), endNode, { d: endDist })
      }
    })

    // Find optimal path
    const optPath = findOptimalPath(G, startNode, endNode)

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

  return solution
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
