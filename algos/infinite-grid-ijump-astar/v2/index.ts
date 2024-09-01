import type { AnySoupElement } from "@tscircuit/soup"
import type { SolutionWithDebugInfo } from "autorouting-dataset/lib/solver-utils/ProblemSolver"
import { IJumpAutorouter } from "./lib/IJumpAutorouter"
import {
  getSimpleRouteJson,
  markObstaclesAsConnected,
  isPointInsideObstacle,
} from "autorouting-dataset/lib/solver-utils/getSimpleRouteJson"
import { getObstaclesFromCircuitJson } from "autorouting-dataset/lib/solver-utils/getObstaclesFromCircuitJson"

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

export const getObstaclesFromSoup = getObstaclesFromCircuitJson

export {
  IJumpAutorouter,
  getSimpleRouteJson,
  markObstaclesAsConnected,
  isPointInsideObstacle,
  getObstaclesFromCircuitJson,
}
