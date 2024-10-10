import type { AnyCircuitElement as AnySoupElement } from "circuit-json"
import { renderCircuitToSoup } from "../../generator-utils/renderCircuitToSoup"
import type { ProblemGenerator } from "../types"
import { SingleTraceCircuit } from "./SingleTraceCircuit"
import { replaceTracesWithErrors } from "../../generator-utils/replaceTracesWithErrors"
import { withCheckRegenerate } from "../utils/with-check-regenerate"

export const getSingleTraceProblemGenerator = (): ProblemGenerator => {
  const generateSingleTraceProblem: ProblemGenerator["getExample"] = async ({
    seed,
  }): Promise<AnySoupElement[]> => {
    return replaceTracesWithErrors(
      await renderCircuitToSoup(<SingleTraceCircuit seed={seed} />),
    )
  }

  return {
    getExample: withCheckRegenerate(generateSingleTraceProblem),
  }
}
