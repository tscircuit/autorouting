import type { AnySoupElement } from "@tscircuit/soup"
import type { SolutionWithDebugInfo } from "autorouting-dataset/lib/solver-utils/ProblemSolver"
import { getSimpleRouteJson } from "autorouting-dataset/lib/solver-utils/getSimpleRouteJson"
import { MultilayerIjump } from "./MultilayerIjump"
import { getFullConnectivityMapFromCircuitJson } from "circuit-json-to-connectivity-map"

export function autoroute(soup: AnySoupElement[]): SolutionWithDebugInfo {
  const connMap = getFullConnectivityMapFromCircuitJson(soup)
  const input = getSimpleRouteJson(soup, {
    layerCount: 2,
    optimizeWithGoalBoxes: true,
    connMap,
  })

  const autorouter = new MultilayerIjump({
    input,
    connMap,
  })

  const solution = autorouter.solveAndMapToTraces()

  return {
    solution,
    debugSolutions: autorouter.debugSolutions,
    debugMessage: autorouter.debugMessage,
  }
}
