import { getSimpleRouteJson, type SimplifiedPcbTrace } from "solver-utils"
import type { AnyCircuitElement } from "circuit-json"

export function autoroute(soup: AnyCircuitElement[]): SimplifiedPcbTrace[] {
  const input = getSimpleRouteJson(soup)

  // TODO: implement your algorithm here

  return []
}
