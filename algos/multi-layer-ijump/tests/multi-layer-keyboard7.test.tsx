import { getSimpleRouteJson } from "autorouting-dataset"
import { getKeyboardGenerator } from "autorouting-dataset/lib/generators/keyboards"
import { test, expect } from "bun:test"
import { MultilayerIjump } from "../MultilayerIjump"
import { circuitJsonToPcbSvg } from "circuit-to-svg"
import { getFullConnectivityMapFromCircuitJson } from "circuit-json-to-connectivity-map"

test("multi-layer ijump keyboard", async () => {
  const soup = await getKeyboardGenerator().getExample({ seed: 7 })
  const connMap = getFullConnectivityMapFromCircuitJson(soup)
  const input = getSimpleRouteJson(soup, { layerCount: 2, connMap })

  const autorouter = new MultilayerIjump({
    input,
    connMap,
    optimizeWithGoalBoxes: true,
  })

  const result = autorouter.solveAndMapToTraces()

  expect(circuitJsonToPcbSvg(soup.concat(result as any))).toMatchSvgSnapshot(
    import.meta.path,
  )
})
