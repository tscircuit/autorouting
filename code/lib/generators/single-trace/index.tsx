import {renderCircuitToSoup} from "../../generator-utils/renderCircuitToSoup"
import type {ProblemGenerator} from "../types"
import { SingleTraceCircuit } from "./SingleTraceCircuit"

export const getSingleTraceProblemGenerator = (): ProblemGenerator => {
  const generateSingleTraceProblem: ProblemGenerator = ({seed}) => {
    return renderCircuitToSoup(<SingleTraceCircuit seed={seed} />)
  }
  return generateSingleTraceProblem
}
