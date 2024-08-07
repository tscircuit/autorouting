import { startDevServer } from "autorouting-dataset"
import { autoroute } from "./index"

await startDevServer({
  solver: autoroute,
  solverName: "gridless-poi",
  port: 3080,
})
