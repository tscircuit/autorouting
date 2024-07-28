// @ts-ignore
import frontend from "../../../frontend-dist/index.html" with { type: "text" }
import { getScriptContent } from "./get-script-content"
import { getDatasetGenerator } from "../generators"
import type { AnySoupElement } from "@tscircuit/soup"
import type { AppContext } from "./app-context"
import type { IncomingMessage, ServerResponse } from "node:http"
import {
  checkEachPcbPortConnected,
  checkEachPcbTraceNonOverlapping,
} from "@tscircuit/checks"
import { runChecks } from "../benchmark/run-checks"
import { tscircuitBuiltinSolver } from "../../../algos/tscircuit-builtin"
import { isValidSolution } from "../benchmark/is-valid-solution"

export const serverEntrypoint = async (
  req: IncomingMessage,
  res: ServerResponse<IncomingMessage>,
  ctx: AppContext,
) => {
  const { solver = tscircuitBuiltinSolver } = ctx
  let problemSoup: AnySoupElement[] | undefined
  let solutionSoup: AnySoupElement[] | undefined
  let userMessage: string | undefined

  // For /problem/* urls...
  const [, , problemType, seedStr] = req.url!.split("/")
  const seed = seedStr ? Number.parseInt(seedStr) : 0

  if (req.url!.includes("/problem/")) {
    try {
      problemSoup = await getDatasetGenerator(problemType as any).getExample({
        seed,
      })
    } catch (e: any) {
      userMessage = `Error generating problem: ${e.message}\n\n${e.stack}`
      console.error(userMessage)
    }
  }

  if (problemSoup) {
    solutionSoup = (await solver(problemSoup as AnySoupElement[])).concat(
      problemSoup,
    ) as any
  }

  // Add errors to solutionSoup for overlapping traces etc. (run eval)
  if (solutionSoup) {
    solutionSoup.push(...runChecks(problemSoup!, solutionSoup))
  }

  if (req.url!.includes(".json")) {
    res.writeHead(200, { "Content-Type": "application/json" })
    if (req.url!.includes(".solution.json")) {
      res.writeHead(200, {
        "content-disposition": `attachment; filename=${problemType}${seed}.solution.json`,
      })
      res.end(JSON.stringify(solutionSoup, null, 2))
    } else {
      res.writeHead(200, {
        "content-disposition": `attachment; filename=${problemType}${seed}.problem.json`,
      })
      res.end(JSON.stringify(problemSoup, null, 2))
    }
    return
  }

  res.writeHead(200, { "Content-Type": "text/html" })
  res.end(
    frontend.replace(
      "<!-- INJECT_SCRIPT -->",
      getScriptContent({
        problemSoup,
        solutionSoup,
        userMessage,
        solverName: ctx.solverName,
        hasCustomSolver: Boolean(ctx.solver),
        isSolutionCorrect: isValidSolution(
          problemSoup as any,
          solutionSoup as any,
        ),
      }),
    ),
  )
}
