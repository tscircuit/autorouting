import {
  getSimpleRouteJson,
  type SimplifiedPcbTrace,
} from "autorouting-dataset"
import type { AnySoupElement } from "@tscircuit/soup"

export function autoroute(soup: AnySoupElement[]): SimplifiedPcbTrace[] {
  const input = getSimpleRouteJson(soup)

  // TODO: implement your algorithm here

  return []
}
