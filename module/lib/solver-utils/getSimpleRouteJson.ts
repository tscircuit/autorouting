import type { AnySoupElement } from "@tscircuit/soup"
import type { SimpleRouteJson } from "./SimpleRouteJson"
import { su } from "@tscircuit/soup-util"
import type { Obstacle } from "../types"

export const getSimpleRouteJson = (soup: AnySoupElement[]): SimpleRouteJson => {
  const routeJson: SimpleRouteJson = {} as any

  routeJson.layerCount = 1

  // Derive obstacles from pcb_smtpad, pcb_hole, and pcb_plated_hole
  routeJson.obstacles = getObstaclesFromSoup(soup)

  // Derive connections using source_traces, source_ports, source_nets
  routeJson.connections = []
  for (const element of soup) {
    if (element.type === "source_trace") {
      const connection = {
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
          }
        }),
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

export const getObstaclesFromSoup = (soup: AnySoupElement[]) => {
  const obstacles: Obstacle[] = []
  for (const element of soup) {
    if (element.type === "pcb_smtpad") {
      if (element.shape === "circle") {
        obstacles.push({
          // @ts-ignore
          type: "oval",
          center: {
            x: element.x,
            y: element.y,
          },
          width: element.radius * 2,
          height: element.radius * 2,
          connectedTo: [],
        })
      } else if (element.shape === "rect") {
        obstacles.push({
          type: "rect",
          center: {
            x: element.x,
            y: element.y,
          },
          width: element.width,
          height: element.height,
          connectedTo: [],
        })
      }
    } else if (element.type === "pcb_hole") {
      if (element.hole_shape === "oval") {
        obstacles.push({
          // @ts-ignore
          type: "oval",
          center: {
            x: element.x,
            y: element.y,
          },
          width: element.hole_width,
          height: element.hole_height,
          connectedTo: [],
        })
      } else if (element.hole_shape === "square") {
        obstacles.push({
          type: "rect",
          center: {
            x: element.x,
            y: element.y,
          },
          width: element.hole_diameter,
          height: element.hole_diameter,
          connectedTo: [],
        })
      }
    } else if (element.type === "pcb_plated_hole") {
      if (element.shape === "circle") {
        obstacles.push({
          // @ts-ignore
          type: "oval",
          center: {
            x: element.x,
            y: element.y,
          },
          width: element.outer_diameter,
          height: element.outer_diameter,
          connectedTo: [],
        })
      } else if (element.shape === "oval" || element.shape === "pill") {
        obstacles.push({
          // @ts-ignore
          type: "oval",
          center: {
            x: element.x,
            y: element.y,
          },
          width: element.outer_width,
          height: element.outer_height,
          connectedTo: [],
        })
      }
    }
  }
  return obstacles
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
