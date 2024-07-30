import { startDevServer } from "autorouting-dataset"
import { tscircuitBuiltinSolver } from "./index"

await startDevServer({
  solver: tscircuitBuiltinSolver,
  port: 3080,
})
