import type { AnyCircuitElement as AnySoupElement } from "circuit-json"
import { createRoot } from "@tscircuit/react-fiber"
import { createProjectBuilder } from "@tscircuit/builder"

export const renderCircuitToSoup = (
  circuitReact: any,
): Promise<AnySoupElement[]> => {
  const project = createProjectBuilder()

  return createRoot().render(circuitReact, project) as any
}
