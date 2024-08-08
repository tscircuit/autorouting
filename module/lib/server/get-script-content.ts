import type { AnySoupElement } from "@tscircuit/soup"
import { AVAILABLE_DATASETS } from "./available-datasets"
import { AVAILABLE_SOLVERS } from "./available-solvers"

const dedupe = <T>(arr: T[]): T[] => Array.from(new Set(arr))

export const getScriptContent = ({
  problemSoup,
  solutionSoup,
  userMessage,
  solverName,
  defaultSolverName,
  solverLink,
  hasCustomSolver,
  solutionComputeTime,
  isSolutionCorrect,
}: {
  problemSoup?: AnySoupElement[]
  problemSoupWithErrors?: AnySoupElement[] | null
  solutionSoup?: AnySoupElement[]
  solutionComputeTime?: number
  userMessage?: string
  solverName?: string
  defaultSolverName?: string
  solverLink?: string
  hasCustomSolver?: boolean
  isSolutionCorrect?: boolean
}) => {
  return `
  <script type="text/javascript">
  window.AVAILABLE_DATASETS = ${JSON.stringify(AVAILABLE_DATASETS ?? null, null, 2)}
  window.PROBLEM_SOUP = ${JSON.stringify(problemSoup ?? null, null, 2)}
  window.SOLUTION_SOUP = ${JSON.stringify(solutionSoup ?? null, null, 2)}
  window.SOLUTION_COMPUTE_TIME = ${solutionComputeTime ?? "null"}
  window.USER_MESSAGE = ${JSON.stringify(userMessage ?? null, null, 2)}
  window.HAS_CUSTOM_SOLVER = ${(hasCustomSolver ?? false).toString()}
  window.SOLVER_NAME = "${solverName ?? "unknown"}"
  window.SOLVER_LINK= "${solverLink ?? ""}"
  window.IS_SOLUTION_CORRECT = ${(isSolutionCorrect ?? false).toString()}
  window.AVAILABLE_SOLVERS = ${JSON.stringify(
    dedupe(
      [...AVAILABLE_SOLVERS, solverName, defaultSolverName].filter(
        (name): name is string => Boolean(name),
      ),
    ),
    null,
    2,
  )}
  </script>
  `
}
