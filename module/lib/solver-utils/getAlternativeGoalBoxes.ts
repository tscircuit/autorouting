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
  PcbConnectivityMap,
} from "circuit-json-to-connectivity-map"
import type { ConnectionWithGoalAlternatives } from "./ConnectionWithAlternatives"

/**
 * Given an element id, returns a list of obstacles that are an
 * alternative to reaching the goal element.
 *
 * These can then be analyzed to find potentially shorter routes
 */
export function getAlternativeGoalBoxes(params: {
  pcbConnMap: PcbConnectivityMap
  goalElementId: string
}): Obstacle[] {
  const { pcbConnMap, goalElementId } = params

  if (!goalElementId.startsWith("pcb_port_")) {
    throw new Error(
      `Currently alternative goal boxes must have a goal id with prefix "pcb_port_" (got ${goalElementId})`,
    )
  }

  const goalTraces = pcbConnMap.getAllTracesConnectedToPort(goalElementId)

  return getObstaclesFromCircuitJson(goalTraces)
}
// export const getAlternativeGoalBoxesForEachPoint = (para
export const getConnectionWithAlternativeGoalBoxes = (params: {
  connection: SimpleRouteConnection
  soup: AnySoupElement[]
}): ConnectionWithGoalAlternatives => {
  let { connection, soup } = params

  if (connection.pointsToConnect.length !== 2) {
    throw new Error(
      `Connection must have exactly 2 points for alternative goal boxes (got ${connection.pointsToConnect.length})`,
    )
  }
  const pcbConnMap = new PcbConnectivityMap(soup)

  const [a, b] = connection.pointsToConnect

  if (!a.pcb_port_id || !b.pcb_port_id) {
    throw new Error(
      `Connection points must have pcb_port_id for alternative goal box calculation (got ${a.pcb_port_id} and ${b.pcb_port_id})`,
    )
  }

  const goalBoxesA = getAlternativeGoalBoxes({
    goalElementId: a.pcb_port_id,
    pcbConnMap,
  })
  const goalBoxesB = getAlternativeGoalBoxes({
    goalElementId: b.pcb_port_id,
    pcbConnMap,
  })

  // Find new points to connect based on the alternative goal boxes

  throw new Error("Not implemented")
}
