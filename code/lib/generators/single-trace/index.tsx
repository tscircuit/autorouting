import type { AnySoupElement } from "@tscircuit/soup"
import { renderCircuitToSoup } from "../../generator-utils/renderCircuitToSoup"
import type { ProblemGenerator } from "../types"
import { SingleTraceCircuit } from "./SingleTraceCircuit"

export const getSingleTraceProblemGenerator = (): ProblemGenerator => {
  const generateSingleTraceProblem: ProblemGenerator["getExample"] = ({
    seed,
  }): Promise<AnySoupElement[]> => {
    return renderCircuitToSoup(<SingleTraceCircuit seed={seed} />)
  }
  return { getExample: generateSingleTraceProblem }
}
