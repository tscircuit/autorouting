import type { Obstacle } from "../types"

export interface SimpleRouteConnection {
  name: string
  pointsToConnect: Array<{ x: number; y: number }>
}

export interface SimpleRouteJson {
  layerCount: number
  obstacles: Obstacle[]
  connections: Array<SimpleRouteConnection>
  bounds: { minX: number; maxX: number; minY: number; maxY: number }
}
