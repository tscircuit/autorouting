import type { AnySoupElement } from "@tscircuit/soup"
import type { SolutionWithDebugInfo } from "autorouting-dataset/lib/solver-utils/ProblemSolver"
import { InfgridAutorouter } from "../../infinite-grid-astar/InfgridAutorouter"
import { getSimpleRouteJson } from "autorouting-dataset"

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
