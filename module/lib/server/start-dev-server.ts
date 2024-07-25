import http from "node:http"
import { serverEntrypoint } from "./server-entrypoint"
import type { ProblemSolver } from "../solver-utils/ProblemSolver"

export const startDevServer = ({ solver, port = 3000 }: { solver?: ProblemSolver, port?: number } = {}) => {
  const server = http.createServer(async (req, res) => {
    return serverEntrypoint(req, res, { solver })
  })

  server.listen(port, () => {
    console.log("Server running on http://localhost:3000/")
  })

  return server
}
