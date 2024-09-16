import { runBenchmark } from "benchmark"
import { autoroute } from "./index"

await runBenchmark({
  solver: autoroute,
  solverName: "jump-point-grid",
  verbose: true,
})
