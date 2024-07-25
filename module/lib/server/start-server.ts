import http from "node:http"
import { serverEntrypoint } from "./server-entrypoint"
import type { ProblemSolver } from "../solver-utils/ProblemSolver"

export const startServer = ({ solver }: { solver?: ProblemSolver } = {}) => {
  const server = http.createServer(async (req, res) => {
    return serverEntrypoint(req, res, { solver })
  })

  server.listen(3000, () => {
    console.log("Server running on http://localhost:3000/")
  })

  return server
}
