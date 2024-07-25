export type SimplifiedPcbTrace = {
  type: "pcb_trace"
  pcb_trace_id: string
  route: Array<{
    route_type: "wire" | "via"
    x: number
    y: number
    width: number
    layer: string
  }>
}
