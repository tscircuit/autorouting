import type { AnySoupElement, LayerRef } from "@tscircuit/soup"

export function addViasForPcbTraceRoutes(solutionSoup: AnySoupElement[]) {
  for (const elm of solutionSoup ?? []) {
    if (elm.type === "pcb_trace") {
      for (const point of elm.route) {
        if (point.route_type === "via") {
          solutionSoup!.push({
            type: "pcb_via",
            x: point.x,
            y: point.y,
            hole_diameter: 0.3,
            outer_diameter: 0.6,
            layers: [point.from_layer as LayerRef, point.to_layer as LayerRef],
            from_layer: point.from_layer as LayerRef,
            to_layer: point.to_layer as LayerRef,
          })
        }
      }
    }
  }
}
