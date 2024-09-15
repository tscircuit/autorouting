import { getSimpleRouteJson } from "autorouting-dataset"
import { test, expect } from "bun:test"
import { circuitJsonToPcbSvg } from "circuit-to-svg"
import { Circuit } from "@tscircuit/core"
import { transformPCBElements } from "@tscircuit/soup-util"
import { translate } from "transformation-matrix"
import type { AnySoupElement } from "@tscircuit/soup"
import { getDebugSvg } from "../../infinite-grid-ijump-astar/tests/fixtures/get-debug-svg"
import { MultilayerIjump } from "../MultilayerIjump"

const OneByOnePad = (props: {
  name: string
  pcbX?: number
  pcbY?: number
  layer: string
}) => (
  <chip name={props.name} pcbX={props.pcbX} pcbY={props.pcbY}>
    <footprint>
      <smtpad
        pcbX={0}
        pcbY={0}
        shape="rect"
        width="0.5mm"
        height="0.5mm"
        layer={props.layer as any}
        portHints={["pin1"]}
      />
    </footprint>
  </chip>
)

test("multimargin-ijump-astar simple", () => {
  const circuit = new Circuit()

  circuit.add(
    <board width="25mm" height="4mm" routingDisabled>
      {Array.from({ length: 10 }).map((_, i) => (
        <resistor
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

  const input = getSimpleRouteJson(inputCircuitJson, { layerCount: 2 })

  const autorouter = new MultilayerIjump({
    input,
    debug: true,
  })

  const solution = autorouter.solveAndMapToTraces()

  expect(
    circuitJsonToPcbSvg(inputCircuitJson.concat(solution as any)),
  ).toMatchSvgSnapshot(import.meta.path)
})
