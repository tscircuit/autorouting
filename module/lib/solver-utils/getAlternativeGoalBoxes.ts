import type { AnyCircuitElement as AnySoupElement } from "circuit-json"
import {
  getObstaclesFromCircuitJson,
  type Obstacle,
  type PointWithLayer,
  type SimpleRouteConnection,
  type SimpleRouteJson,
} from "solver-utils"
import {
  type ConnectivityMap,
  getFullConnectivityMapFromCircuitJson,
  PcbConnectivityMap,
} from "circuit-json-to-connectivity-map"
import type { ConnectionWithGoalAlternatives } from "./ConnectionWithAlternatives"
import { findNearestPointsBetweenBoxSets } from "@tscircuit/math-utils/nearest-box"

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

  return getObstaclesFromCircuitJson(goalTraces).map((obs) => ({
    ...obs,
    connectedTo: [goalElementId],
  }))
}

/**
 * Takes a connection and a connectivity map, then swaps the pointsToConnect
 * with more optimal points.
 *
 * For example, we may see there is an easier or closer way to connect two
 * points because of a trace that has already been routed.
 */
export const getConnectionWithAlternativeGoalBoxes = (params: {
  connection: SimpleRouteConnection
  pcbConnMap: PcbConnectivityMap
}): ConnectionWithGoalAlternatives => {
  let { connection, pcbConnMap } = params

  if (connection.pointsToConnect.length !== 2) {
    throw new Error(
      `Connection must have exactly 2 points for alternative goal boxes (got ${connection.pointsToConnect.length})`,
    )
  }

  const [a, b] = connection.pointsToConnect

  // TODO fix only one of them needs to have a pcb port id defined, or even
  // neither of them and we return an empty goal box array
  if (!a.pcb_port_id || !b.pcb_port_id) {
    throw new Error(
      `Connection points must have pcb_port_id for alternative goal box calculation (got ${a.pcb_port_id} and ${b.pcb_port_id})`,
    )
  }

  const goalBoxesA = getAlternativeGoalBoxes({
    goalElementId: a.pcb_port_id,
    pcbConnMap,
  }).concat([
    {
      center: a,
      width: 0.01,
      height: 0.01,
      connectedTo: [a.pcb_port_id],
      layers: [a.layer],
      type: "rect",
    },
  ])
  const goalBoxesB = getAlternativeGoalBoxes({
    goalElementId: b.pcb_port_id,
    pcbConnMap,
  }).concat([
    {
      center: b,
      width: 0.01,
      height: 0.01,
      connectedTo: [b.pcb_port_id],
      layers: [b.layer],
      type: "rect",
    },
  ])

  if (goalBoxesA.length <= 1 && goalBoxesB.length <= 1) {
    return {
      ...connection,
      startPoint: a,
      endPoint: b,
      goalBoxes: [],
    }
  }

  // Find new points to connect based on the alternative goal boxes
  const nearestPoints = findNearestPointsBetweenBoxSets(goalBoxesA, goalBoxesB)

  let startPoint: PointWithLayer
  let endPoint: PointWithLayer
  let goalBoxes: Obstacle[]

  if (goalBoxesA.length >= goalBoxesB.length) {
    startPoint = { ...b, ...nearestPoints.pointB }
    endPoint = { ...a, ...nearestPoints.pointA }
    goalBoxes = goalBoxesA
  } else {
    startPoint = { ...a, ...nearestPoints.pointA }
    endPoint = { ...b, ...nearestPoints.pointB }
    goalBoxes = goalBoxesB
  }

  return {
    startPoint,
    endPoint,
    goalBoxes,
    name: connection.name,
    pointsToConnect: [startPoint, endPoint],
  }
}
