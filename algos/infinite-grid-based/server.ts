import { startDevServer } from "autorouting-dataset";
import { autoroute } from "./index";

await startDevServer({
  solver: autoroute,
  solverName: "infinite-grid-based",
  port: 3080,
});
