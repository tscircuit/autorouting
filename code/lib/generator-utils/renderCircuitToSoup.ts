import type { AnySoupElement } from "@tscircuit/soup"
import { createRoot, createProjectBuilder } from "tscircuit"

export const renderCircuitToSoup = (
  circuitReact: any
): Promise<AnySoupElement[]> => {
  const project = createProjectBuilder()

  return createRoot().render(circuitReact, project) as any
}
