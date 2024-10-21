import { Circuit } from "@tscircuit/core"
import { expect, test } from "bun:test"
import { getFullConnectivityMapFromCircuitJson } from "circuit-json-to-connectivity-map"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import { getSimpleRouteJson } from "solver-utils"
import { MultilayerIjump } from "../MultilayerIjump"

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
          key={`t1_${i}`}
          // @ts-ignore
          name={`U${i}`}
          from={`.R0 > .pin1`}
          to={`.R${i + 1} > .pin1`}
        />,
        <trace
          key={`t2_${i}`}
          // @ts-ignore
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
    convertCircuitJsonToPcbSvg(
      inputCircuitJson.concat(solution as any) as any,
      // .map((a) => (a.type === "pcb_smtpad" ? { ...a, layer: "bottom" } : a)),
    ),
  ).toMatchSvgSnapshot(import.meta.path)
})
