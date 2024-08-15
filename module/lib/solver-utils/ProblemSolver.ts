import type { AnySoupElement } from "@tscircuit/soup"
import type { SimplifiedPcbTrace } from "../types"

export type ValidSolutionElement = AnySoupElement | SimplifiedPcbTrace

export type SolutionWithDebugInfo<
  SolElm extends AnySoupElement | SimplifiedPcbTrace =
    | AnySoupElement
    | SimplifiedPcbTrace,
> = {
  solution: SolElm[]

  /**
   * Solvers can return a debugSolutions object that contains various stages or
   * debugging information to understand the output of the solver. There is
   * a dropdown menu when using the server that allows you to explore each
   * debugSolution output. The debugSolutions don't need to actually solve the
   * problem, you can just output fabrication_notes etc. for debugging.
   *
   * For a good example of debugSolutions, check out the gridless-poi solver
   * that outputs a visualization of it's mesh.
   */
  debugSolutions?: Record<string, AnySoupElement[]>

  /**
   * Solvers can return a debugMessage, usually with the iteration count or odd
   * cases etc. This is displayed below the solution in the dev server.
   */
  debugMessage?: string | null
}

export type ProblemSolver = (
  soup: AnySoupElement[],
) =>
  | ValidSolutionElement[]
  | Promise<ValidSolutionElement[]>
  | Promise<SolutionWithDebugInfo>
  | SolutionWithDebugInfo
