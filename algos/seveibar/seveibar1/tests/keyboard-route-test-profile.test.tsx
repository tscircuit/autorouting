import { getKeyboardGenerator } from "autorouting-dataset/lib/generators/keyboards"
import { expect, test } from "bun:test"
import { getFullConnectivityMapFromCircuitJson } from "circuit-json-to-connectivity-map"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import { getSimpleRouteJson } from "solver-utils"
import { MultilayerIjump } from "algos/multi-layer-ijump/MultilayerIjump"

test("multi-layer ijump keyboard", async () => {
  const durations: Array<[number, number]> = []
  let soup: any
  let autorouter: MultilayerIjump = null as any
  let result: any
  for (let i = 0; i < 20; i++) {
    soup = await getKeyboardGenerator().getExample({ seed: 7 + i })
    const connMap = getFullConnectivityMapFromCircuitJson(soup)
    const input = getSimpleRouteJson(soup, { layerCount: 2, connMap })

    autorouter = new MultilayerIjump({
      input,
      connMap,
      isRemovePathLoopsEnabled: true,
      optimizeWithGoalBoxes: true,
    })

    const start = process.hrtime()
    result = autorouter.solveAndMapToTraces()
    const duration = process.hrtime(start)
    durations.push(duration)
  }

  const totalDuration = durations.reduce(
    (acc, duration) => {
      return [acc[0] + duration[0], acc[1] + duration[1]]
    },
    [0, 0],
  )
  console.log("\n\n-----------------------------\n\n")
  console.log(
    `TIME TO ROUTE: ${totalDuration[0] * 1000 + totalDuration[1] / 1e6}ms`,
  )
  console.table(autorouter.obstacles.profiler?.getResultsPretty())
  console.table(autorouter.profiler?.getResultsPretty())

  // console.log(autorouter.obstacles.cases)

  expect(
    convertCircuitJsonToPcbSvg(soup.concat(result as any) as any),
  ).toMatchSvgSnapshot(import.meta.path)
})
