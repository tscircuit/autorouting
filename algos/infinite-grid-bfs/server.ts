import { startDevServer } from "autorouting-dataset"
import { autoroute } from "./index"

await startDevServer({
  solver: autoroute,
  solverName: "jumpy-grid",
  port: 3080,
})
