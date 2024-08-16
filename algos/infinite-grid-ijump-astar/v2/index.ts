import type { AnySoupElement } from "@tscircuit/soup"
import type { SolutionWithDebugInfo } from "autorouting-dataset/lib/solver-utils/ProblemSolver"
// import { IJumpAutorouter } from "../../infinite-grid-astar/IJumpAutorouter"
import { IJumpAutorouter } from "./lib/IJumpAutorouter"
import { getSimpleRouteJson } from "autorouting-dataset"

export function autoroute(soup: AnySoupElement[]): SolutionWithDebugInfo {
  const input = getSimpleRouteJson(soup)

  const autorouter = new IJumpAutorouter({
    input,
  })

  const solution = autorouter.solveAndMapToTraces()

  return {
    solution,
    debugSolutions: autorouter.debugSolutions,
    debugMessage: autorouter.debugMessage,
  }
}
