import { getSimpleRouteJson, type SimplifiedPcbTrace } from "solver-utils"
import { test, expect } from "bun:test"
import { circuitJsonToPcbSvg } from "circuit-to-svg"
import { Circuit } from "@tscircuit/core"
import { transformPCBElements } from "@tscircuit/soup-util"
import { translate } from "transformation-matrix"
import type {
  AnyCircuitElement,
  AnyCircuitElement as AnySoupElement,
} from "circuit-json"
import type { GeneralizedAstarAutorouter } from "algos/infinite-grid-ijump-astar/v2/lib/GeneralizedAstar"

export const getDebugSvg = ({
  inputCircuitJson,
  autorouter,
  solution,
  rowHeight = 2.5,
  colWidth = 0,
  colCount = 1,
}: {
  inputCircuitJson: AnyCircuitElement[]
  autorouter: GeneralizedAstarAutorouter
  solution?: AnySoupElement[] | SimplifiedPcbTrace[]
  rowHeight?: number
  colWidth?: number
  colCount?: number
}) => {
  const debugSolutions = Object.entries(autorouter.debugSolutions!).map(
    ([debugSolutionName, solutionCircuitJson]) => ({
      debugSolutionName,
      solutionCircuitJson,
    }),
  )

  const aggCircuitJson: AnyCircuitElement[] = []

  const getTranslationForIndex = (i: number) => {
    if (colCount && colWidth) {
      return translate(
        colWidth * (i % colCount),
        -rowHeight * Math.floor(i / colCount),
      )
    }
    return translate(0, -rowHeight * i)
  }

  for (let i = 0; i < debugSolutions.length; i++) {
    const { debugSolutionName, solutionCircuitJson } = debugSolutions[i]
    const translatedCircuitJson = transformPCBElements(
      JSON.parse(
        JSON.stringify(
          solutionCircuitJson.concat(inputCircuitJson).concat([
            {
              type: "pcb_fabrication_note_text",
              text: debugSolutionName,
              pcb_component_id: "unknown",
              layer: "top",
              font: "tscircuit2024",
              font_size: 0.2,
              anchor_position: { x: -5, y: 0 },
              anchor_alignment: "center",
              pcb_fabrication_note_text_id: `debug_note_${i}`, // Add a unique ID
            },
          ]),
        ),
      ),
      getTranslationForIndex(i),
    )
    aggCircuitJson.push(...(translatedCircuitJson as any))
  }

  const finalCircuitJson = JSON.parse(
    JSON.stringify(inputCircuitJson.concat((solution as any) ?? [])),
  )
  aggCircuitJson.push(
    ...(transformPCBElements(
      finalCircuitJson as any,
      getTranslationForIndex(debugSolutions.length),
    ) as any),
  )

  return circuitJsonToPcbSvg(aggCircuitJson)
}
