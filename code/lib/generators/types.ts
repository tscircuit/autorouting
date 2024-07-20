import type { AnySoupElement } from "@tscircuit/soup"

export type ProblemGenerator = (params: {
  seed: number
}) => Promise<AnySoupElement>
