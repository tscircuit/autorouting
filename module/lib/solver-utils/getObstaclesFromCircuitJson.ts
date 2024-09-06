import type { AnySoupElement } from "@tscircuit/soup"
import type { Obstacle } from "../types"
import { getObstaclesFromRoute } from "./getObstaclesFromRoute"

export const getObstaclesFromCircuitJson = (soup: AnySoupElement[]) => {
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
    } else if (element.type === "pcb_keepout") {
      if (element.shape === "circle") {
        obstacles.push({
          // @ts-ignore
          type: "oval",
          center: {
            x: element.center.x,
            y: element.center.y,
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
    }
     else if (element.type === "pcb_hole") {
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
    } else if (element.type === "pcb_trace") {
      const traceObstacles = getObstaclesFromRoute(element.route, element.source_trace_id!)
      obstacles.push(...traceObstacles)
    }
  }
  return obstacles
}
