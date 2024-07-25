export interface SimpleRouteJson {
  layerCount: number
  obstacles: Array<{
    type: "rect" | "oval" // NOTE: most datasets do not contain ovals
    center: { x: number; y: number }
    width: number
    height: number
    connectedTo: string[]
  }>
  connections: Array<{
    name: string
    pointsToConnect: Array<{ x: number; y: number }>
  }>
  bounds: { minX: number; maxX: number; minY: number; maxY: number }
}
