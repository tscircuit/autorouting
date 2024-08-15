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
export type Obstacle = {
  // TODO include ovals
  type: "rect" // NOTE: most datasets do not contain ovals
  center: { x: number; y: number }
  width: number
  height: number
  connectedTo: string[]
}
