import { runBenchmark } from "autorouting-dataset"
import { autoroute } from "./v1"

await runBenchmark({
  solver: autoroute,
  solverName: "infgrid-ijump-astar",
  verbose: true,
})
