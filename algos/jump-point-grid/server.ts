import { startDevServer } from "server"
import { autoroute } from "./index"

await startDevServer({
  solver: autoroute,
  solverName: "jump-point-grid",
  port: 3080,
})
