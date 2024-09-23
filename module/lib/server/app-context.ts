import type { AnyCircuitElement } from "circuit-json"
import type { ProblemSolver } from "../solver-utils/ProblemSolver"

export type AppContext = {
  solver?: ProblemSolver
  solverName?: string
  defaultSolverName?: string
  solverLink?: string
}
