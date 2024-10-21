import { useRenderedCircuit } from "@tscircuit/core"
import type { AnyCircuitElement } from "circuit-json"

export const renderCircuitToSoup = (
  circuitReact: any,
): Promise<AnyCircuitElement[]> => {
  const {
    circuitJson: circuitJsonFromChildren,
    error: errorFromChildren,
    isLoading,
  } = useRenderedCircuit(circuitReact)

  return circuitJsonFromChildren as any
}
