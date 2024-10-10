You are implementing an autorouting algorithm in Typescript that matches the interface below:

```ts
// from autorouting-dataset
export type SimplifiedPcbTrace = {
  type: "pcb_trace"
  pcb_trace_id: string
  route: Array<{
    route_type: "wire"
    x: number
    y: number
    width: number
    layer: "top" | "bottom"
  }>
}
export type Obstacle = {
  type: "rect" // NOTE: most datasets do not contain ovals
  center: { x: number; y: number }
  width: number
  height: number
  connectedTo: string[]
}
export interface SimpleRouteJson {
  layerCount: number
  obstacles: Obstacle[]
  connections: Array<{
    name: string
    pointsToConnect: Array<{ x: number; y: number }>
  }>
  bounds: { minX: number; maxX: number; minY: number; maxY: number }
}
```

```ts
import {
  getSimpleRouteJson,
  type SimplifiedPcbTrace,
  type Obstacle,
  type SimpleRouteJson,
} from "solver-utils"
import type { AnyCircuitElement } from "circuit-json"

export function autoroute(
  circuitJson: AnyCircuitElement[]
): SimplifiedPcbTrace[] {
  const input = getSimpleRouteJson(circuitJson)

  // TODO: implement your algorithm here

  return []
}
```
