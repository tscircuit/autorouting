import { runBenchmark } from "autorouting-dataset"
import { autoroute } from "./"

await runBenchmark({
  solver: autoroute,
  solverName: "multi-layer-ijump",
  verbose: true,
})
