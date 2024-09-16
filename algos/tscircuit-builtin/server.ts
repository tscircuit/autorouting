import { startDevServer } from "server"
import { tscircuitBuiltinSolver } from "./index"

await startDevServer({
  solver: tscircuitBuiltinSolver,
  port: 3080,
})
