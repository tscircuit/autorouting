import type { AnyCircuitElement as AnySoupElement } from "circuit-json"
import { renderCircuitToSoup } from "../../generator-utils/renderCircuitToSoup"
import type { ProblemGenerator } from "../types"
import { TracesCircuit } from "./TracesCircuit"
import { replaceTracesWithErrors } from "../../generator-utils/replaceTracesWithErrors"
import { withCheckRegenerate } from "../utils/with-check-regenerate"

export const getTracesProblemGenerator = (): ProblemGenerator => {
  const generateTracesProblem: ProblemGenerator["getExample"] = async ({
    seed,
  }): Promise<AnySoupElement[]> => {
    return replaceTracesWithErrors(
      await renderCircuitToSoup(<TracesCircuit seed={seed} />),
    )
  }

  return {
    getExample: withCheckRegenerate(generateTracesProblem),
  }
}
