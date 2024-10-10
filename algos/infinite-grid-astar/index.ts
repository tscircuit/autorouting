import { InfgridAutorouter } from "./InfgridAutorouter"
import { getSimpleRouteJson, type SolutionWithDebugInfo } from "solver-utils"
import type { AnyCircuitElement } from "circuit-json"

export function autoroute(soup: AnyCircuitElement[]): SolutionWithDebugInfo {
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
