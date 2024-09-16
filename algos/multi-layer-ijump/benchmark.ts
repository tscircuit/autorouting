import { runBenchmark } from "benchmark"
import { autoroute } from "./"

await runBenchmark({
  solver: autoroute,
  solverName: "multi-layer-ijump",
  verbose: true,
})
