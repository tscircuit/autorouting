import type { AnyCircuitElement } from "circuit-json"
import type { SimpleRouteConnection, SimpleRouteJson } from "./SimpleRouteJson"
import { su } from "@tscircuit/soup-util"
import type { Obstacle } from "../types"
import { getObstaclesFromCircuitJson } from "./getObstaclesFromCircuitJson"
import { getConnectionWithAlternativeGoalBoxes } from "./getAlternativeGoalBoxes"
import type { ConnectionWithGoalAlternatives } from "./ConnectionWithAlternatives"
import {
  ConnectivityMap,
  getFullConnectivityMapFromCircuitJson,
  PcbConnectivityMap,
} from "circuit-json-to-connectivity-map"

export const getSimpleRouteJson = (
  soup: AnyCircuitElement[],
  opts: {
    layerCount?: number
    optimizeWithGoalBoxes?: boolean
    connMap?: ConnectivityMap
  } = {},
): SimpleRouteJson => {
  const routeJson: SimpleRouteJson = {
    minTraceWidth: 0.1,
  } as Partial<SimpleRouteJson> as any

  routeJson.layerCount = opts.layerCount ?? 1

  // Derive obstacles from pcb_smtpad, pcb_hole, and pcb_plated_hole
  routeJson.obstacles = getObstaclesFromCircuitJson(soup, opts.connMap)

  // Derive connections using source_traces, source_ports, source_nets
  routeJson.connections = []
  for (const element of soup) {
    if (element.type === "source_trace") {
      let connection: ConnectionWithGoalAlternatives | SimpleRouteConnection = {
        name: element.source_trace_id,
        pointsToConnect: element.connected_source_port_ids.map((portId) => {
          const pcb_port = su(soup).pcb_port.getWhere({
            source_port_id: portId,
          })
          if (!pcb_port) {
            throw new Error(
              `Could not find pcb_port for source_port_id "${portId}"`,
            )
          }
          return {
            x: pcb_port.x,
            y: pcb_port.y,
            layer: pcb_port.layers?.[0] ?? "top",
            pcb_port_id: pcb_port.pcb_port_id,
          }
        }),
      }

      if (opts.optimizeWithGoalBoxes) {
        const pcbConnMap = new PcbConnectivityMap(soup)
        connection = getConnectionWithAlternativeGoalBoxes({
          connection,
          pcbConnMap,
        })
      }

      routeJson.connections.push(connection)

      // Check if any points are inside obstacles
      markObstaclesAsConnected(
        routeJson.obstacles,
        connection.pointsToConnect,
        connection.name,
      )
    }
  }

  const bounds = {
    minX: Infinity,
    maxX: -Infinity,
    minY: Infinity,
    maxY: -Infinity,
  }
  for (const obstacle of routeJson.obstacles) {
    bounds.minX = Math.min(bounds.minX, obstacle.center.x - obstacle.width / 2)
    bounds.maxX = Math.max(bounds.maxX, obstacle.center.x + obstacle.width / 2)
    bounds.minY = Math.min(bounds.minY, obstacle.center.y - obstacle.height / 2)
    bounds.maxY = Math.max(bounds.maxY, obstacle.center.y + obstacle.height / 2)
  }
  for (const connection of routeJson.connections) {
    for (const point of connection.pointsToConnect) {
      bounds.minX = Math.min(bounds.minX, point.x)
      bounds.maxX = Math.max(bounds.maxX, point.x)
      bounds.minY = Math.min(bounds.minY, point.y)
      bounds.maxY = Math.max(bounds.maxY, point.y)
    }
  }
  routeJson.bounds = bounds

  return routeJson
}

export const markObstaclesAsConnected = (
  obstacles: Obstacle[],
  pointsToConnect: Array<{ x: number; y: number }>,
  connectionName: string,
) => {
  for (const point of pointsToConnect) {
    for (const obstacle of obstacles) {
      if (isPointInsideObstacle(point, obstacle)) {
        obstacle.connectedTo.push(connectionName)
      }
    }
  }
}

// Helper function to check if a point is inside an obstacle
export function isPointInsideObstacle(
  point: { x: number; y: number },
  obstacle: {
    type: string
    center: { x: number; y: number }
    width: number
    height: number
  },
): boolean {
  const halfWidth = obstacle.width / 2
  const halfHeight = obstacle.height / 2

  if (obstacle.type === "rect") {
    return (
      point.x >= obstacle.center.x - halfWidth &&
      point.x <= obstacle.center.x + halfWidth &&
      point.y >= obstacle.center.y - halfHeight &&
      point.y <= obstacle.center.y + halfHeight
    )
  } else if (obstacle.type === "oval") {
    const normalizedX = (point.x - obstacle.center.x) / halfWidth
    const normalizedY = (point.y - obstacle.center.y) / halfHeight
    return normalizedX * normalizedX + normalizedY * normalizedY <= 1
  }

  return false
}
