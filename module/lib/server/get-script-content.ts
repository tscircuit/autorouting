import type { AnySoupElement } from "@tscircuit/soup"

export const getScriptContent = ({
  problemSoup,
  solutionSoup,
  userMessage,
  solverName,
  hasCustomSolver,
}: {
  problemSoup?: AnySoupElement[]
  solutionSoup?: AnySoupElement[]
  userMessage?: string
  solverName?: string
  hasCustomSolver?: boolean
}) => {
  return `
  <script type="text/javascript">
  window.PROBLEM_SOUP = ${JSON.stringify(problemSoup ?? null, null, 2)}
  window.SOLUTION_SOUP = ${JSON.stringify(solutionSoup ?? null, null, 2)}
  window.USER_MESSAGE = ${JSON.stringify(userMessage ?? null, null, 2)}
  window.HAS_CUSTOM_SOLVER = ${(hasCustomSolver ?? false).toString()}
  window.SOLVER_NAME = "${solverName ?? "unknown"}"
  </script>
  `
}
