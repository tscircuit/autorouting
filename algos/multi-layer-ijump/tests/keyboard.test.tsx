import { getSimpleRouteJson } from "autorouting-dataset"
import { getKeyboardGenerator } from "autorouting-dataset/lib/generators/keyboards"
import { test, expect } from "bun:test"
import { MultilayerIjump } from "../MultilayerIjump"
import { circuitJsonToPcbSvg } from "circuit-to-svg"

test("multi-layer ijump keyboard", async () => {
  const soup = await getKeyboardGenerator().getExample({ seed: 7 })
  const input = getSimpleRouteJson(soup, { layerCount: 2 })

  const autorouter = new MultilayerIjump({
    input,
  })

  const result = autorouter.solveAndMapToTraces()

  expect(circuitJsonToPcbSvg(soup.concat(result as any))).toMatchSvgSnapshot(
    import.meta.path,
  )
})
