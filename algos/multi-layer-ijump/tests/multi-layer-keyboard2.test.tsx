import { getSimpleRouteJson } from "solver-utils"
import { getKeyboardGenerator } from "autorouting-dataset/lib/generators/keyboards"
import { test, expect } from "bun:test"
import { MultilayerIjump } from "../MultilayerIjump"
import { circuitJsonToPcbSvg } from "circuit-to-svg"

test("multi-layer ijump keyboard", async () => {
  const soup = await getKeyboardGenerator().getExample({ seed: 2 })
  const input = getSimpleRouteJson(soup, { layerCount: 2 })

  const autorouter = new MultilayerIjump({
    input,
    optimizeWithGoalBoxes: true,
  })

  const result = autorouter.solveAndMapToTraces()

  expect(circuitJsonToPcbSvg(soup.concat(result as any))).toMatchSvgSnapshot(
    import.meta.path,
  )
})
