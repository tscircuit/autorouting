import type { AnyCircuitElement, PCBTrace } from "circuit-json"
import { buildPcbTraceElements } from "@tscircuit/builder"
import { su } from "@tscircuit/soup-util"
import { mm } from "@tscircuit/mm"
import { NetManager } from "@tscircuit/checks"

function getBuildContext(): any {
  let idCounter = 0
  return {
    getId: (prefix: string) => {
      idCounter += 1
      return `${prefix}_k${idCounter}`
    },
    convert: mm,
  }
}

export const tscircuitBuiltinSolver = (soup: AnyCircuitElement[]) => {
  const newElements: AnyCircuitElement[] = []
  const nm = new NetManager()
  const ctx = getBuildContext()
  for (const source_trace of su(soup).source_trace.list()) {
    if (nm.isConnected(source_trace.connected_source_port_ids)) continue
    const source_ports_in_route = source_trace.connected_source_port_ids.map(
      (portId) => su(soup).source_port.get(portId)!,
    )
    nm.setConnected(source_trace.connected_source_port_ids)
    const { pcb_trace, pcb_errors, pcb_vias } = buildPcbTraceElements(
      {
        elements: soup,
        source_ports_in_route: source_ports_in_route as any,
        thickness: 0.1,
        pcb_route_hints: [],
        source_trace_id: source_trace.source_trace_id,
      },
      ctx,
    )
    newElements.push(pcb_trace as PCBTrace, ...pcb_errors, ...pcb_vias)
  }
  return newElements
}
