import { getSimpleRouteJson } from "autorouting-dataset"
import { test, expect } from "bun:test"
import { circuitJsonToPcbSvg } from "circuit-to-svg"
import { IJumpAutorouter } from "../v2"
import { Circuit } from "@tscircuit/core"
import { transformPCBElements } from "@tscircuit/soup-util"
import { translate } from "transformation-matrix"
import type { AnySoupElement } from "@tscircuit/soup"
import { getDebugSvg } from "./fixtures/get-debug-svg"

test("ijump-astar: intersection with margin", () => {
  const circuit = new Circuit()

  circuit.add(
    <board width="10mm" height="2mm" routingDisabled>
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-3} />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={3} />
      <trace from=".R1 > .pin1" to=".R2 > .pin1" />
    </board>,
  )

  const inputCircuitJson = circuit.getCircuitJson()

  const input = getSimpleRouteJson(inputCircuitJson)

  const autorouter = new IJumpAutorouter({
    input,
    debug: true,
  })

  const traces = autorouter.solveAndMapToTraces()

  expect(getDebugSvg(inputCircuitJson, autorouter)).toMatchSvgSnapshot(
    import.meta.path,
  )
})
