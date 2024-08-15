import { startDevServer } from "autorouting-dataset"
import { autoroute } from "./v1"

await startDevServer({
  solver: autoroute,
  solverName: "infgrid-ijump-astar",
  port: 3080,
})
