import { runBenchmark } from "autorouting-dataset"
import { autorouteMultiMargin } from "../infinite-grid-ijump-astar/v2"

await runBenchmark({
  solver: autorouteMultiMargin,
  solverName: "multi-margin-ijump-astar",
  verbose: true,
})
