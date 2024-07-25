import type { AnySoupElement } from "@tscircuit/soup"
import { su } from "@tscircuit/soup-util"

export const replaceTracesWithErrors = (
  soup: AnySoupElement[],
): AnySoupElement[] => {
  const newSoup: AnySoupElement[] = []
  for (const element of soup) {
    if (element.type === "pcb_trace") {
      const { pcb_component_id, source_trace_id, route, pcb_trace_id } = element
      const source_port_ids: string[] = su(soup).source_trace.get(
        source_trace_id!,
      )!.connected_source_port_ids
      const pcb_port_ids: string[] = source_port_ids
        .map(
          (source_port_id) =>
            su(soup).pcb_port.getWhere({ source_port_id })!.pcb_port_id,
        )
        .filter(Boolean)

      // newSoup.push({
      //   type: "pcb_error",
      //   error_type: "pcb_trace_error",
      //   message: "Trace is not connected",
      //   source_trace_id: source_trace_id!,
      //   pcb_trace_id: pcb_trace_id,
      //   pcb_error_id: `error_${pcb_trace_id}`,
      //   pcb_component_ids: pcb_component_id ? [pcb_component_id] : [],
      //   pcb_port_ids: pcb_port_ids,
      // })
      newSoup.push({
        ...element,
        route: [],
      })

      continue
    }
    newSoup.push(element)
  }
  return newSoup
}
