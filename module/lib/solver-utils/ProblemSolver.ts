import type { AnySoupElement } from "@tscircuit/soup"
import type { SimplifiedPcbTrace } from "../types"

export type ProblemSolver = (
  soup: AnySoupElement[],
) =>
  | AnySoupElement[]
  | Promise<AnySoupElement[]>
  | SimplifiedPcbTrace[]
  | Promise<SimplifiedPcbTrace[]>
