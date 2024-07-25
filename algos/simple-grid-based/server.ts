import { startDevServer } from "autorouting-dataset"
import { autoroute } from "./index"

await startDevServer({
  solver: autoroute,
  solverName: "simple-grid-based-autorouter",
  port: 3000,
})
