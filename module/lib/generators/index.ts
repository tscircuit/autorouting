import { getDistantSingleTraceProblemGenerator } from "./distant-single-trace"
import { getSingleTraceProblemGenerator } from "./single-trace"
import { getTracesProblemGenerator } from "./traces"
import type { ProblemGenerator, ProblemType } from "./types"

export const getDatasetGenerator = (
  problemType: ProblemType,
): ProblemGenerator => {
  if (problemType === "single-trace") {
    return getSingleTraceProblemGenerator()
  } else if (problemType === "traces") {
    return getTracesProblemGenerator()
  } else if (problemType === "distant-single-trace") {
    return getDistantSingleTraceProblemGenerator()
  }
  throw new Error(
    `Generator for "${problemType}" not found, may not be implemented`,
  )
}
