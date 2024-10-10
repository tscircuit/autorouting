import { getSimpleRouteJson, type SimplifiedPcbTrace } from "solver-utils"
import type { AnyCircuitElement } from "circuit-json"

export function autoroute(
  circuitJson: AnyCircuitElement[],
): SimplifiedPcbTrace[] {
  const input = getSimpleRouteJson(circuitJson)

  // TODO: implement your algorithm here and return SimplifiedPcbTrace[]

  return []
}
