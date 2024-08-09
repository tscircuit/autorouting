import type { AnySoupElement } from "@tscircuit/soup"
import type { ProblemSolver, SolutionWithDebugInfo } from "./ProblemSolver"

export const normalizeSolution = async (
  $solverResult: ReturnType<ProblemSolver>,
): Promise<SolutionWithDebugInfo<AnySoupElement>> => {
  const solverResult = await $solverResult
  if ("solution" in solverResult) {
    return solverResult as any
  }
  return {
    solution: solverResult as AnySoupElement[],
  }
}
