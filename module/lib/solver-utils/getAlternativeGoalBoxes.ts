import type { AnySoupElement } from "@tscircuit/soup"
import {
  getObstaclesFromCircuitJson,
  type Obstacle,
  type SimpleRouteConnection,
  type SimpleRouteJson,
} from "autorouting-dataset"
import {
  type ConnectivityMap,
  getFullConnectivityMapFromCircuitJson,
} from "circuit-json-to-connectivity-map"
import type { ConnectionWithGoalAlternatives } from "./ConnectionWithAlternatives"

/**
 * Given an element id, returns a list of obstacles that are an
 * alternative to reaching the goal element.
 *
 * These can then be analyzed to find potentially shorter routes
 */
export function getAlternativeGoalBoxes(params: {
  soup: AnySoupElement[]
  connMap: ConnectivityMap
  goalElementId: string
}): Obstacle[] {
  const { soup, connMap, goalElementId } = params
  const goalNet = connMap.getNetConnectedToId(goalElementId)
  if (!goalNet) return []

  const goalElements: AnySoupElement[] = []
  for (const elm of soup) {
    const elmId = (elm as any)[`${elm.type}_id`]
    const elmNet = connMap.getNetConnectedToId(elmId)
    if (elmNet === goalNet) {
      goalElements.push(elm)
    }
  }

  return getObstaclesFromCircuitJson(goalElements)
}
// export const getAlternativeGoalBoxesForEachPoint = (para
export const getConnectionWithAlternativeGoalBoxes = (params: {
  connection: SimpleRouteConnection
  soup: AnySoupElement[]
  connMap?: ConnectivityMap
}): ConnectionWithGoalAlternatives => {
  let { connection, soup, connMap } = params
  if (!connMap) {
    connMap = getFullConnectivityMapFromCircuitJson(soup)
  }

  if (connection.pointsToConnect.length !== 2) {
    throw new Error(
      `Connection must have exactly 2 points for alternative goal boxes (got ${connection.pointsToConnect.length})`,
    )
  }

  const [a, b] = connection.pointsToConnect

  // const goalBoxesA = getAlternativeGoalBoxes({
  //   soup,
  //   connMap,
  //   goalElementId:
  // })

  throw new Error("Not implemented")
}
