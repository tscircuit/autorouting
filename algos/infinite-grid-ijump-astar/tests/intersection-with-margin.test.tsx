import { getSimpleRouteJson } from "autorouting-dataset"
import { test, expect } from "bun:test"
import { circuitJsonToPcbSvg } from "circuit-to-svg"
import { IJumpAutorouter } from "../v2"
import { Circuit } from "@tscircuit/core"

test("ijump-astar: multilayer trace", () => {
  const circuit = new Circuit()

  circuit.add(
    <board width="10mm" height="10mm">
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-3} />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={3} />
      <trace from=".R1 > .pin1" to=".R2 > .pin1" />
    </board>,
  )

  const circuitJson = circuit.getCircuitJson()

  const input = getSimpleRouteJson(circuitJson)

  const autorouter = new IJumpAutorouter({
    input,
  })

  const traces = autorouter.solveAndMapToTraces()

  expect(
    circuitJsonToPcbSvg(circuitJson.concat(traces as any)),
  ).toMatchSvgSnapshot(import.meta.path)
})
