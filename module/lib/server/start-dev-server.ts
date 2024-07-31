import http from "node:http"
import { serverEntrypoint } from "./server-entrypoint"
import type { ProblemSolver } from "../solver-utils/ProblemSolver"
import { createSolverFromUrl } from "../solver-utils/createSolverFromUrl"

export const startDevServer = ({
  solver,
  port = 3080,
  solverName,
  solverLink,
  solverUrl,
}: {
  solver?: ProblemSolver
  port?: number
  solverName?: string
  solverLink?: string
  solverUrl?: string
} = {}) => {
  if (solverUrl) {
    solver = createSolverFromUrl(solverUrl)
  }

  const server = http.createServer(async (req, res) => {
    return serverEntrypoint(req, res, { solver, solverName, solverLink })
  })

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`)
  })

  return server
}
