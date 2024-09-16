import { runBenchmark } from "benchmark"
import { autoroute } from "./index"

await runBenchmark({
  solver: autoroute,
  solverName: "simple-grid",
  verbose: true,
})
