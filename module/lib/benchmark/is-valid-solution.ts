import type { AnyCircuitElement } from "circuit-json"
import { runChecks } from "./run-checks"
import type { SimplifiedPcbTrace } from "../types"

export const isValidSolution = (
  problem?: AnyCircuitElement[],
  solution?: AnyCircuitElement[] | SimplifiedPcbTrace[],
): boolean => {
  if (!problem || !solution) return false
  return runChecks(problem, solution as any).length === 0
}
