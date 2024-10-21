import { getKeyboardGenerator } from "autorouting-dataset/lib/generators/keyboards"
import { expect, test } from "bun:test"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import { getSimpleRouteJson } from "solver-utils"
import { MultilayerIjump } from "../MultilayerIjump"

test("multi-layer ijump keyboard", async () => {
  const soup = await getKeyboardGenerator().getExample({ seed: 2 })
  const input = getSimpleRouteJson(soup, { layerCount: 2 })

  const autorouter = new MultilayerIjump({
    input,
    optimizeWithGoalBoxes: true,
  })

  const result = autorouter.solveAndMapToTraces()

  expect(
    convertCircuitJsonToPcbSvg(soup.concat(result as any) as any),
  ).toMatchSvgSnapshot(import.meta.path)
})
