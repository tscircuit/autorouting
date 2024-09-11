import { getSimpleRouteJson } from "autorouting-dataset"
import { test, expect } from "bun:test"
import { circuitJsonToPcbSvg } from "circuit-to-svg"
import { Circuit } from "@tscircuit/core"
import { transformPCBElements } from "@tscircuit/soup-util"
import { translate } from "transformation-matrix"
import type { AnySoupElement } from "@tscircuit/soup"
import type { GeneralizedAstarAutorouter } from "algos/infinite-grid-ijump-astar/v2/lib/GeneralizedAstar"

export const getDebugSvg = (
  inputCircuitJson: AnySoupElement[],
  autorouter: GeneralizedAstarAutorouter,
) => {
  const debugSolutions = Object.entries(autorouter.debugSolutions!).map(
    ([debugSolutionName, solutionCircuitJson]) => ({
      debugSolutionName,
      solutionCircuitJson,
    }),
  )

  const aggCircuitJson: AnySoupElement[] = []

  for (let i = 0; i < debugSolutions.length; i++) {
    const { debugSolutionName, solutionCircuitJson } = debugSolutions[i]
    const translatedCircuitJson = transformPCBElements(
      JSON.parse(
        JSON.stringify(
          solutionCircuitJson.concat(inputCircuitJson).concat({
            type: "pcb_fabrication_note_text",
            text: debugSolutionName,
            pcb_component_id: "unknown",
            layer: "top",
            font: "tscircuit2024",
            font_size: 0.2,
            anchor_position: { x: -5, y: 0 },
            anchor_alignment: "center",
          }),
        ),
      ),
      translate(0, -2 * i),
    )
    aggCircuitJson.push(...translatedCircuitJson)
  }

  return circuitJsonToPcbSvg(aggCircuitJson)
}
