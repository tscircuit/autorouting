import {
  checkEachPcbPortConnected,
  checkEachPcbTraceNonOverlapping,
} from "@tscircuit/checks"
import type { AnyCircuitElement } from "circuit-json"

export const runChecks = (
  problemSoup: AnyCircuitElement[],
  solutionSoup: AnyCircuitElement[],
): AnyCircuitElement[] => {
  const errors = [
    ...checkEachPcbTraceNonOverlapping(problemSoup.concat(solutionSoup)),
    ...checkEachPcbPortConnected(problemSoup.concat(solutionSoup)),
  ]
  return errors
}
