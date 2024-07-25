import type { AnySoupElement } from "@tscircuit/soup"
import type { SimpleRouteJson } from "./SimpleRouteJson"
import { su } from "@tscircuit/soup-util"

export const getSimpleRouteJson = (soup: AnySoupElement[]): SimpleRouteJson => {
  const routeJson: SimpleRouteJson = {} as any

  routeJson.layerCount = 1

  // Derive obstacles from pcb_smtpad, pcb_hole, and pcb_plated_hole
  routeJson.obstacles = []
  for (const element of soup) {
    if (element.type === "pcb_smtpad") {
      if (element.shape === "circle") {
        routeJson.obstacles.push({
          type: "oval",
          center: {
            x: element.x,
            y: element.y,
          },
          width: element.radius,
          height: element.radius,
        })
      } else if (element.shape === "rect") {
        routeJson.obstacles.push({
          type: "rect",
          center: {
            x: element.x,
            y: element.y,
          },
          width: element.width,
          height: element.height,
        })
      }
    } else if (element.type === "pcb_hole") {
      if (element.hole_shape === "oval") {
        routeJson.obstacles.push({
          type: "oval",
          center: {
            x: element.x,
            y: element.y,
          },
          width: element.hole_width,
          height: element.hole_height,
        })
      } else if (element.hole_shape === "square") {
        routeJson.obstacles.push({
          type: "rect",
          center: {
            x: element.x,
            y: element.y,
          },
          width: element.hole_diameter,
          height: element.hole_diameter,
        })
      }
    } else if (element.type === "pcb_plated_hole") {
      if (element.shape === "circle") {
        routeJson.obstacles.push({
          type: "oval",
          center: {
            x: element.x,
            y: element.y,
          },
          width: element.outer_diameter,
          height: element.outer_diameter,
        })
      } else if (element.shape === "oval") {
        routeJson.obstacles.push({
          type: "oval",
          center: {
            x: element.x,
            y: element.y,
          },
          width: element.outer_width,
          height: element.outer_height,
        })
      } else if (element.shape === "pill") {
        routeJson.obstacles.push({
          type: "oval",
          center: {
            x: element.x,
            y: element.y,
          },
          width: element.outer_width,
          height: element.outer_height,
        })
      }
    }
  }

  // Derive connections using source_traces, source_ports, source_nets
  routeJson.connections = []
  for (const element of soup) {
    if (element.type === "source_trace") {
      routeJson.connections.push({
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
      })
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
