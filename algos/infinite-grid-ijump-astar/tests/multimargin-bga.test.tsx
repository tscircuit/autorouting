import { Circuit } from "@tscircuit/core"
import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import { getSimpleRouteJson } from "solver-utils"
import { IJumpMultiMarginAutorouter } from "../v2/lib/IJumpMultiMarginAutorouter"
import { getDebugSvg } from "./fixtures/get-debug-svg"

const OneByOnePad = (props: { name: string; pcbX?: number; pcbY?: number }) => (
  <chip name={props.name} pcbX={props.pcbX} pcbY={props.pcbY}>
    <footprint>
      <smtpad
        pcbX={0}
        pcbY={0}
        shape="rect"
        width="1mm"
        height="1mm"
        portHints={["pin1"]}
      />
    </footprint>
  </chip>
)

test("multimargin-ijump-astar: bga9", () => {
  const circuit = new Circuit()

  circuit.add(
    <board width="10mm" height="2mm" routingDisabled>
      <chip name="U1" footprint="bga9" />
      <trace from=".U1 .pin1" to=".U1 .pin9" />
    </board>,
  )

  const inputCircuitJson = circuit.getCircuitJson()

  const input = getSimpleRouteJson(inputCircuitJson as AnyCircuitElement[])

  const autorouter = new IJumpMultiMarginAutorouter({
    input,
    debug: true,
  })

  const solution = autorouter.solveAndMapToTraces()

  expect(solution).toHaveLength(1)

  expect(
    getDebugSvg({ inputCircuitJson, autorouter, solution, rowHeight: 5 }),
  ).toMatchSvgSnapshot(import.meta.path)
})
