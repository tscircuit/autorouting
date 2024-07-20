import type { AnySoupElement } from "@tscircuit/soup"
import { renderCircuitToSoup } from "../../generator-utils/renderCircuitToSoup"
import type { ProblemGenerator } from "../types"
import { SingleTraceCircuit } from "./SingleTraceCircuit"
import { replaceTracesWithErrors } from "../../generator-utils/replaceTracesWithErrors"

export const getSingleTraceProblemGenerator = (): ProblemGenerator => {
  const generateSingleTraceProblem: ProblemGenerator["getExample"] = async ({
    seed,
  }): Promise<AnySoupElement[]> => {
    return replaceTracesWithErrors(
      await renderCircuitToSoup(<SingleTraceCircuit seed={seed} />),
    )
  }

  const getExampleWithTscircuitSolution: ProblemGenerator["getExampleWithTscircuitSolution"] =
    async ({ seed }) => {
      const soup = await generateSingleTraceProblem({ seed })
      return renderCircuitToSoup(<SingleTraceCircuit seed={seed} />)
    }

  return {
    getExample: generateSingleTraceProblem,
    getExampleWithTscircuitSolution,
  }
}
