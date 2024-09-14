import type { Obstacle } from "../types"

export interface PointWithLayer {
  x: number
  y: number
  layer: string
  pcb_port_id?: string
}

export interface SimpleRouteConnection {
  name: string
  pointsToConnect: Array<PointWithLayer>
}

export interface SimpleRouteJson {
  layerCount: number
  obstacles: Obstacle[]
  connections: Array<SimpleRouteConnection>
  bounds: { minX: number; maxX: number; minY: number; maxY: number }
}
