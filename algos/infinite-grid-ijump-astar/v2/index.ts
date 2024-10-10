import type { AnyCircuitElement as AnySoupElement } from "circuit-json"
import type { SolutionWithDebugInfo } from "solver-utils/ProblemSolver"
import { IJumpAutorouter } from "./lib/IJumpAutorouter"
import {
  getSimpleRouteJson,
  markObstaclesAsConnected,
  isPointInsideObstacle,
} from "solver-utils/getSimpleRouteJson"
import { getObstaclesFromCircuitJson } from "solver-utils/getObstaclesFromCircuitJson"
import { IJumpMultiMarginAutorouter } from "./lib/IJumpMultiMarginAutorouter"

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

export function autorouteMultiMargin(
  soup: AnySoupElement[],
): SolutionWithDebugInfo {
  const input = getSimpleRouteJson(soup)

  const autorouter = new IJumpMultiMarginAutorouter({
    input,
    isRemovePathLoopsEnabled: true,
  })

  const solution = autorouter.solveAndMapToTraces()

  return {
    solution,
    debugSolutions: autorouter.debugSolutions,
    debugMessage: autorouter.debugMessage,
  }
}

export const getObstaclesFromSoup = getObstaclesFromCircuitJson

export { autoroute as autorouteMultiLayer } from "../../multi-layer-ijump"
export { MultilayerIjump } from "../../multi-layer-ijump/MultilayerIjump"

export {
  IJumpAutorouter,
  IJumpMultiMarginAutorouter,
  getSimpleRouteJson,
  markObstaclesAsConnected,
  isPointInsideObstacle,
  getObstaclesFromCircuitJson,
}
