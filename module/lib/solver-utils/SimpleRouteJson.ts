import type { Obstacle } from "../types"

export interface SimpleRouteJson {
  layerCount: number
  obstacles: Obstacle[]
  connections: Array<{
    name: string
    pointsToConnect: Array<{ x: number; y: number }>
  }>
  bounds: { minX: number; maxX: number; minY: number; maxY: number }
}
