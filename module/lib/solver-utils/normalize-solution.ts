import type { ProblemSolver, SolutionWithDebugInfo } from "./ProblemSolver"

export const normalizeSolution = async (
  $solverResult: ReturnType<ProblemSolver>,
): Promise<SolutionWithDebugInfo> => {
  const solverResult = await $solverResult
  if ("solution" in solverResult) {
    return solverResult
  }
  return {
    solution: solverResult,
  }
}
