import { runBenchmark } from "benchmark"
import { autoroute } from "./v2"

await runBenchmark({
  solver: autoroute,
  solverName: "infgrid-ijump-astar",
  verbose: true,
})
