import type { AnySoupElement } from "@tscircuit/soup"

declare global {
  interface Window {
    PROBLEM_SOUP: AnySoupElement[]
    SOLUTION_SOUP: AnySoupElement[]
    HAS_CUSTOM_SOLVER?: string
    USER_MESSAGE?: string
    SOLVER_NAME?: string
    AVAILABLE_SOLVERS?: string[]
    SOLVER_LINK?: string
    AVAILABLE_DATASETS?: string[]
    SOLUTION_COMPUTE_TIME?: number
    IS_SOLUTION_CORRECT?: boolean
  }
}
