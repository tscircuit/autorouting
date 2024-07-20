import { getSingleTraceProblemGenerator } from "./single-trace"
import type { ProblemGenerator } from "./types"

export const getDatasetGenerator = (
  problemType: "single-trace"
): ProblemGenerator => {
  return getSingleTraceProblemGenerator()
}
