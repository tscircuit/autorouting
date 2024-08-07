import { runBenchmark } from "autorouting-dataset"
import { autoroute } from "./index"

await runBenchmark({
  solver: autoroute,
  solverName: "incremental-gridless-poi",
  sampleCount: 30,
  verbose: true,
})
