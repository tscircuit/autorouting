export { startDevServer } from "./lib/server/start-dev-server"
export { runBenchmark } from "./lib/benchmark/run-benchmark"
export { getSimpleRouteJson } from "./lib/solver-utils/getSimpleRouteJson"
export * from "./lib/types"
export * from "./lib/solver-utils/SimpleRouteJson"
export * from "./lib/solver-utils/getObstaclesFromCircuitJson"
export * from "./lib/solver-utils/getSimpleRouteJson"

// COMPAT
import { getObstaclesFromCircuitJson } from "./lib/solver-utils/getObstaclesFromCircuitJson"
export const getObstaclesFromSoup = getObstaclesFromCircuitJson
