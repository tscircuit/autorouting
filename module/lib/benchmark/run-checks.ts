import {
  checkEachPcbPortConnected,
  checkEachPcbTraceNonOverlapping,
} from "@tscircuit/checks"
import type { AnySoupElement } from "@tscircuit/soup"

export const runChecks = (
  problemSoup: AnySoupElement[],
  solutionSoup: AnySoupElement[],
): AnySoupElement[] => {
  const errors = [
    ...checkEachPcbTraceNonOverlapping(problemSoup.concat(solutionSoup)),
    ...checkEachPcbPortConnected(problemSoup.concat(solutionSoup)),
  ]
  return errors
}
