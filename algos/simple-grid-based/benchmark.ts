import { runBenchmark } from "autorouting-dataset"
import { autoroute } from "./index"

await runBenchmark({
  solver: autoroute,
  solverName: "simple-grid-based-autorouter",
  verbose: true,
})
