import type { AnySoupElement } from "@tscircuit/soup"
import { renderCircuitToSoup } from "../../generator-utils/renderCircuitToSoup"
import type { ProblemGenerator } from "../types"
import { SingleTraceCircuit } from "../single-trace/SingleTraceCircuit"
import { replaceTracesWithErrors } from "../../generator-utils/replaceTracesWithErrors"

export const getDistantSingleTraceProblemGenerator = (): ProblemGenerator => {
  const generateDistantSingleTraceProblem: ProblemGenerator["getExample"] =
    async ({ seed }): Promise<AnySoupElement[]> => {
      return replaceTracesWithErrors(
        await renderCircuitToSoup(<SingleTraceCircuit seed={seed} />),
      )
    }

  return {
    getExample: generateDistantSingleTraceProblem,
  }
}
