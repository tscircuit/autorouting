import { runBenchmark } from "autorouting-dataset"
import { tscircuitBuiltinSolver } from "./index"

await runBenchmark({
  solver: tscircuitBuiltinSolver,
  verbose: true,
})
