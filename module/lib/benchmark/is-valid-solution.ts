import type { AnySoupElement } from "@tscircuit/soup"
import { runChecks } from "./run-checks"

export const isValidSolution = (
  problem?: AnySoupElement[],
  solution?: AnySoupElement[],
): boolean => {
  if (!problem || !solution) return false
  return runChecks(problem, solution).length === 0
}
