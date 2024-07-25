export type SimplifiedPcbTrace = {
  type: "pcb_trace"
  route: Array<{
    route_type: "wire" | "via"
    x: number
    y: number
    width: number
    layer: string
  }>
}
