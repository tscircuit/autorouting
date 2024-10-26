import { MultilayerIjump } from "algos/multi-layer-ijump/MultilayerIjump"
import { test, expect } from "bun:test"
import { getDatasetGenerator } from "autorouting-dataset/lib/generators"
import { getSimpleRouteJson } from "solver-utils"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"

test("repro2 path-loop-fails on single-trace sample 9", async () => {
  const generator = getDatasetGenerator("single-trace")
  const circuitJson = await generator.getExample({ seed: 9 })
  const input = getSimpleRouteJson(circuitJson, { layerCount: 2 })

  // Run with path loop removal disabled
  const autorouter1 = new MultilayerIjump({
    input,
    isRemovePathLoopsEnabled: false,
    debug: true,
  })
  const solution1 = autorouter1.solveAndMapToTraces()

  // Run with path loop removal enabled
  const autorouter2 = new MultilayerIjump({
    input,
    isRemovePathLoopsEnabled: true,
    debug: true,
  })
  const solution2 = autorouter2.solveAndMapToTraces()

  // Compare results
  expect(solution1).toHaveLength(1)
  expect(solution2).toHaveLength(1)

  expect(
    convertCircuitJsonToPcbSvg(circuitJson.concat(solution1 as any) as any),
  ).toMatchSvgSnapshot(import.meta.path + "-no-loop-removal")

  expect(
    convertCircuitJsonToPcbSvg(circuitJson.concat(solution2 as any) as any),
  ).toMatchSvgSnapshot(import.meta.path + "-with-loop-removal")
})
