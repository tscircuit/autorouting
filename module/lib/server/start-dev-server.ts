import http from "node:http"
import { serverEntrypoint } from "./server-entrypoint"
import type { ProblemSolver } from "../solver-utils/ProblemSolver"

export const startDevServer = ({
  solver,
  port = 3000,
  solverName,
}: { solver?: ProblemSolver; port?: number; solverName?: string } = {}) => {
  const server = http.createServer(async (req, res) => {
    return serverEntrypoint(req, res, { solver, solverName })
  })

  server.listen(port, () => {
    console.log("Server running on http://localhost:3000/")
  })

  return server
}
