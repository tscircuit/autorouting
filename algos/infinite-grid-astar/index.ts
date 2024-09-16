import type { AnySoupElement } from "@tscircuit/soup"
import { InfgridAutorouter } from "./InfgridAutorouter"
import { getSimpleRouteJson, type SolutionWithDebugInfo } from "solver-utils"

export function autoroute(soup: AnySoupElement[]): SolutionWithDebugInfo {
  const input = getSimpleRouteJson(soup)

  const autorouter = new InfgridAutorouter({
    input,
  })
  autorouter.MAX_ITERATIONS = 10_000

  const solution = autorouter.solveAndMapToTraces()

  return {
    solution,
    debugSolutions: autorouter.debugSolutions,
    debugMessage: autorouter.debugMessage,
  }
}
