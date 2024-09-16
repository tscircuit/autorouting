import { startDevServer } from "server"
import { autoroute } from "./index"

await startDevServer({
  solver: autoroute,
  solverName: "infgrid-astar",
  port: 3080,
})
