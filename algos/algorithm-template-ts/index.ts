import { getSimpleRouteJson, type SimplifiedPcbTrace } from "solver-utils"
import type { AnySoupElement } from "@tscircuit/soup"

export function autoroute(soup: AnySoupElement[]): SimplifiedPcbTrace[] {
  const input = getSimpleRouteJson(soup)

  // TODO: implement your algorithm here

  return []
}
