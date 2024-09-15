import type { Obstacle } from "../types"
import type { PointWithLayer, SimpleRouteConnection } from "./SimpleRouteJson"

/**
 * A connection with goal alternatives is a 2 point connection that has a single
 * start point, but many possible "goal boxes". Touching any goal box will connect
 * you to the network and finish the connection
 */
export interface ConnectionWithGoalAlternatives extends SimpleRouteConnection {
  startPoint: PointWithLayer
  endPoint: PointWithLayer
  goalBoxes: Obstacle[]
}
