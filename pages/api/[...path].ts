import type { VercelRequest, VercelResponse } from "@vercel/node"
import { serverEntrypoint } from "../../module/lib/server/server-entrypoint"
import { autoroute } from "../../algos/simple-grid"

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return serverEntrypoint(req, res, {
    solver: autoroute,
    solverName: "simple-grid",
  })
}
