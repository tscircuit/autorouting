import { runBenchmark } from "autorouting-dataset"
import { tscircuitBuiltinSolver } from "./index"

await runBenchmark({
  solver: tscircuitBuiltinSolver,
  solverName: "tscircuit-builtin",
  verbose: true,
})
