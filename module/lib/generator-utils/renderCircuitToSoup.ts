import { Circuit } from "@tscircuit/core"
import type { AnyCircuitElement } from "circuit-json"

export const renderCircuitToSoup = async (
  circuitReact: any,
): Promise<AnyCircuitElement[]> => {
  const circuit = new Circuit()
  circuit.add(circuitReact)
  return circuit.getCircuitJson() as AnyCircuitElement[]
}
