import { getSimpleRouteJson } from "autorouting-dataset"
import { test, expect } from "bun:test"
import { circuitJsonToPcbSvg } from "circuit-to-svg"
import { Circuit } from "@tscircuit/core"
import { transformPCBElements } from "@tscircuit/soup-util"
import { translate } from "transformation-matrix"
import type { AnySoupElement } from "@tscircuit/soup"
import { getDebugSvg } from "../../infinite-grid-ijump-astar/tests/fixtures/get-debug-svg"
import { MultilayerIjump } from "../MultilayerIjump"
import { getFullConnectivityMapFromCircuitJson } from "circuit-json-to-connectivity-map"

test("multimargin-ijump-astar simple", () => {
  const circuit = new Circuit()

  circuit.add(
    <board width="25mm" height="4mm" routingDisabled>
      {Array.from({ length: 10 }).map((_, i) => (
        <resistor
          // @ts-ignore
          key={`R${i}`}
          name={`R${i}`}
          pcbX={i * 2 - 10}
          pcbY={i - 5}
          resistance={100}
          footprint="0402"
          pcbRotation={90}
        />
      ))}
      <trace from={`.R0 > .pin1`} to={`.R0 > .pin2`} />
      {Array.from({ length: 9 }).map((_, i) => [
        <trace
          // @ts-ignore
          key={`t1_${i}`}
          name={`U${i}`}
          from={`.R0 > .pin1`}
          to={`.R${i + 1} > .pin1`}
        />,
        <trace
          // @ts-ignore
          key={`t2_${i}`}
          name={`U${i}`}
          from={`.R${i} > .pin2`}
          to={`.R${i + 1} > .pin2`}
        />,
      ])}
    </board>,
  )

  const inputCircuitJson = circuit.getCircuitJson()

  const connMap = getFullConnectivityMapFromCircuitJson(inputCircuitJson)

  const input = getSimpleRouteJson(inputCircuitJson, {
    layerCount: 2,
    connMap,
    optimizeWithGoalBoxes: true,
  })

  const autorouter = new MultilayerIjump({
    input,
    connMap,
    optimizeWithGoalBoxes: true,
    debug: true,
  })

  const solution = autorouter.solveAndMapToTraces()

  expect(
    circuitJsonToPcbSvg(
      inputCircuitJson.concat(solution as any),
      // .map((a) => (a.type === "pcb_smtpad" ? { ...a, layer: "bottom" } : a)),
    ),
  ).toMatchSvgSnapshot(import.meta.path)
})
