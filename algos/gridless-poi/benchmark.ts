import { runBenchmark } from "autorouting-dataset"
import { autoroute } from "./index"

await runBenchmark({
  solver: autoroute,
  solverName: "gridless-poi",
  sampleCount: 5,
  verbose: true,
})
