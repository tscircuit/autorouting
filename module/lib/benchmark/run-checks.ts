import { checkEachPcbTraceNonOverlapping } from "@tscircuit/checks"
import type { AnySoupElement } from "@tscircuit/soup"

export const runChecks = (
  problemSoup: AnySoupElement[],
  solutionSoup: AnySoupElement[],
): AnySoupElement[] => {
  const errors = [
    ...checkEachPcbTraceNonOverlapping(solutionSoup),
    // Currently broken see https://github.com/tscircuit/tscircuit/issues/293
    // ...checkEachPcbPortConnected(solutionSoup),
  ]
  return errors
}
