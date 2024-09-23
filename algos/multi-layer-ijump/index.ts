import type { AnyCircuitElement } from "circuit-json"
import type { SolutionWithDebugInfo } from "autorouting-dataset/lib/solver-utils/ProblemSolver"
import { getSimpleRouteJson } from "autorouting-dataset/lib/solver-utils/getSimpleRouteJson"
import { MultilayerIjump } from "./MultilayerIjump"
import { getFullConnectivityMapFromCircuitJson } from "circuit-json-to-connectivity-map"

export function autoroute(soup: AnyCircuitElement[]): SolutionWithDebugInfo {
  const connMap = getFullConnectivityMapFromCircuitJson(soup)
  const input = getSimpleRouteJson(soup, {
    layerCount: 2,
    connMap,
  })

  const autorouter = new MultilayerIjump({
    input,
    connMap,
    // isRemovePathLoopsEnabled: true,
    optimizeWithGoalBoxes: true,
  })

  const solution = autorouter.solveAndMapToTraces()

  return {
    solution,
    debugSolutions: autorouter.debugSolutions,
    debugMessage: autorouter.debugMessage,
  }
}
