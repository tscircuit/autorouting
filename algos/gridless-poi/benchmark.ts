import { runBenchmark } from "benchmark"
import { autoroute } from "./index"

await runBenchmark({
  solver: autoroute,
  solverName: "gridless-poi",
  verbose: true,
})
