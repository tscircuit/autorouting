import http from "node:http"
// @ts-ignore
import frontend from "../../dist/index.html" with { type: "text" }
import type { ProblemSolver } from "../solver-utils/ProblemSolver"

export const startServer = ({ solver }: { solver?: ProblemSolver } = {}) => {
  const server = http.createServer((req, res) => {
    res.writeHead(200, { "Content-Type": "text/html" })
    res.end(frontend)
  })

  server.listen(3000, () => {
    console.log("Server running on http://localhost:3000/")
  })

  return server
}

// const server = http.createServer((req, res) => {
//   res.writeHead(200, { 'Content-Type': 'text/plain' });
//   res.end('Hello World!');
// });

// server.listen(3000, () => {
//   console.log('Server running on http://localhost:3000/');
// });
