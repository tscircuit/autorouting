import { getSingleTraceProblemGenerator } from "./single-trace"
import type { ProblemGenerator } from "./types"

export const getDatasetGenerator = (
  problemType: "single-trace",
): ProblemGenerator => {
  if (problemType === "single-trace") {
    return getSingleTraceProblemGenerator()
  }
  throw new Error(
    `Generator for ${problemType} not found, may not be implemented`,
  )
}
