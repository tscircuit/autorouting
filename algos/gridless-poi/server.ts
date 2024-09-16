import { startDevServer } from "server"
import { autoroute } from "./index"

await startDevServer({
  solver: autoroute,
  solverName: "gridless-poi",
  port: 3080,
})
