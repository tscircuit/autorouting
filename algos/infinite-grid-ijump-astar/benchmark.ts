import { runBenchmark } from "autorouting-dataset"
import { autoroute } from "./v2"

await runBenchmark({
  solver: autoroute,
  solverName: "infgrid-ijump-astar",
  verbose: true,
})
