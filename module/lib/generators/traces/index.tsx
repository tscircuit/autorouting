import type { AnySoupElement } from "@tscircuit/soup"
import { renderCircuitToSoup } from "../../generator-utils/renderCircuitToSoup"
import type { ProblemGenerator } from "../types"
import { TracesCircuit } from "./TracesCircuit"
import { replaceTracesWithErrors } from "../../generator-utils/replaceTracesWithErrors"

export const getTracesProblemGenerator = (): ProblemGenerator => {
  const generateTracesProblem: ProblemGenerator["getExample"] = async ({
    seed,
  }): Promise<AnySoupElement[]> => {
    return replaceTracesWithErrors(
      await renderCircuitToSoup(<TracesCircuit seed={seed} />),
    )
  }

  return {
    getExample: generateTracesProblem,
  }
}
