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
          return {
            x: su(soup).pcb_port.getUsing({ source_port_id: portId })!.x,
            y: su(soup).pcb_port.getUsing({ source_port_id: portId })!.y,
          }
        }),
      })
    }
  }

  return routeJson
}
