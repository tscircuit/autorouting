import { startDevServer } from "autorouting-dataset"
// import { autoroute } from "./v1"
import { autoroute } from "./v2"

await startDevServer({
  solver: autoroute,
  solverName: "infgrid-ijump-astar",
  port: 3080,
})
