import { startDevServer } from "autorouting-dataset"
import { autoroute } from "./index"

await startDevServer({
  solver: autoroute,
  solverName: "incremental-gridless-poi",
  port: 3080,
})
