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

export interface Point {
  x: number
  y: number
}

export type Obstacle = {
  // TODO include ovals
  type: "rect" // NOTE: most datasets do not contain ovals
  center: { x: number; y: number }
  width: number
  height: number
  connectedTo: string[]
}

export interface ObstacleWithEdges extends Obstacle {
  top: number
  bottom: number
  left: number
  right: number
}

export type Edge = "top" | "bottom" | "left" | "right"
