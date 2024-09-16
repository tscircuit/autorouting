import { startDevServer } from "server"
import { autoroute } from "./index"

await startDevServer({
  solver: autoroute,
  solverName: "simple-grid",
  port: 3080,
})
