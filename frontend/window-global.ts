import type { AnyCircuitElement } from "circuit-json"

declare global {
  interface Window {
    PROBLEM_SOUP: AnyCircuitElement[]
    SOLUTION_SOUP: AnyCircuitElement[]
    HAS_CUSTOM_SOLVER?: string
    USER_MESSAGE?: string
    SOLVER_NAME?: string
    AVAILABLE_SOLVERS?: string[]
    SOLVER_LINK?: string
    AVAILABLE_DATASETS?: string[]
    SOLUTION_COMPUTE_TIME?: number
    IS_SOLUTION_CORRECT?: boolean
    DEBUG_SOLUTIONS?: Record<string, AnyCircuitElement[]>
    DEBUG_MESSAGE?: string
  }
}
