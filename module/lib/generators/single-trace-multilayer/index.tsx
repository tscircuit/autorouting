import type { AnyCircuitElement as AnySoupElement } from "circuit-json"
import { renderCircuitToSoup } from "../../generator-utils/renderCircuitToSoup"
import type { ProblemGenerator } from "../types"
import { SingleTraceMultilayerCircuit } from "./SingleTraceMultilayerCircuit"
import { replaceTracesWithErrors } from "../../generator-utils/replaceTracesWithErrors"
import { withCheckRegenerate } from "../utils/with-check-regenerate"

export const getSingleTraceMultilayerProblemGenerator =
  (): ProblemGenerator => {
    const generateSingleTraceMultilayerProblem: ProblemGenerator["getExample"] =
      async ({ seed }): Promise<AnySoupElement[]> => {
        return replaceTracesWithErrors(
          await renderCircuitToSoup(
            <SingleTraceMultilayerCircuit seed={seed} />,
          ),
        )
      }

    return {
      getExample: withCheckRegenerate(generateSingleTraceMultilayerProblem),
    }
  }
