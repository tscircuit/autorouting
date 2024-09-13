import type { AnySoupElement } from "@tscircuit/soup"
import { renderCircuitToSoup } from "../../generator-utils/renderCircuitToSoup"
import type { ProblemGenerator } from "../types"
import { replaceTracesWithErrors } from "../../generator-utils/replaceTracesWithErrors"
import { Circuit } from "@tscircuit/core"
import { Keyboard } from "./Keyboard"
import { rand } from "autorouting-dataset/lib/generator-utils/rand"

const progression = [
  { cols: 1, rows: 1, keyCount: 1 },
  { cols: 2, rows: 1, keyCount: 2 },
  { cols: 1, rows: 2, keyCount: 2 },
  { cols: 3, rows: 1, keyCount: 3 },
  { cols: 1, rows: 3, keyCount: 3 },
  { cols: 4, rows: 1, keyCount: 4 },
  { cols: 2, rows: 2, keyCount: 4 },
  { cols: 3, rows: 2, keyCount: 5 },
  { cols: 3, rows: 2, keyCount: 6 },
  { cols: 3, rows: 3, keyCount: 7 },
  { cols: 3, rows: 3, keyCount: 8 },
  { cols: 3, rows: 3, keyCount: 9 },
  { cols: 4, rows: 3, keyCount: 10 },
  { cols: 4, rows: 3, keyCount: 11 },
  { cols: 4, rows: 3, keyCount: 12 },
  { cols: 4, rows: 4, keyCount: 13 },
  { cols: 4, rows: 4, keyCount: 14 },
  { cols: 4, rows: 4, keyCount: 15 },
  { cols: 4, rows: 4, keyCount: 16 },
]

export const getKeyboardGenerator = (): ProblemGenerator => {
  const generateKeyboardProblem: ProblemGenerator["getExample"] = async ({
    seed,
  }): Promise<AnySoupElement[]> => {
    const circuit = new Circuit()

    if (seed <= progression.length) {
      circuit.add(<Keyboard {...progression[seed - 1]} />)
    } else {
      const rows = rand(seed, "rows").int(4, 10)
      const cols = rand(seed, "cols").int(4, 10)
      const keyCount = Math.min(
        seed,
        rand(seed, "keyCount").int(4, rows * cols),
      )
      const keyIndices: number[] = Array.from({ length: rows * cols })
        .map((_, i) => i)
        .sort((a, b) => rand(seed, "keySort", a).float() - 0.5)
        .slice(0, keyCount)
      circuit.add(
        <Keyboard
          cols={cols}
          rows={rows}
          keyCount={keyCount}
          keyIndices={keyIndices}
        />,
      )
    }

    return circuit.getCircuitJson()
  }

  return {
    getExample: generateKeyboardProblem,
  }
}
