import { runBenchmark } from "benchmark"
import { tscircuitBuiltinSolver } from "./index"

await runBenchmark({
  solver: tscircuitBuiltinSolver,
  solverName: "tscircuit-builtin",
  verbose: true,
})
