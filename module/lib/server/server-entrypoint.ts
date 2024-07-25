// @ts-ignore
import frontend from "../../dist/index.html" with { type: "text" }
import { getScriptContent } from "./get-script-content"
import { getDatasetGenerator } from "../generators"
import type { AnySoupElement } from "@tscircuit/soup"
import type { AppContext } from "./app-context"
import type { IncomingMessage, ServerResponse } from "node:http"
import {
  checkEachPcbPortConnected,
  checkEachPcbTraceNonOverlapping,
} from "@tscircuit/checks"

export const serverEntrypoint = async (
  req: IncomingMessage,
  res: ServerResponse<IncomingMessage>,
  ctx: AppContext,
) => {
  const { solver } = ctx
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
      userMessage = `Error generating problem: ${e.message}`
      console.error(userMessage)
    }
  }

  if (solver && problemSoup) {
    solutionSoup = await solver(problemSoup as AnySoupElement[])
  } else if (problemSoup && req.url!.includes("/problem/")) {
    solutionSoup = await getDatasetGenerator(
      problemType as any,
    ).getExampleWithTscircuitSolution({ seed })
  }

  // Add errors to solutionSoup for overlapping traces etc. (run eval)
  if (solutionSoup) {
    const errors = [
      ...checkEachPcbTraceNonOverlapping(solutionSoup),
      // Currently broken see https://github.com/tscircuit/tscircuit/issues/293
      // ...checkEachPcbPortConnected(solutionSoup),
    ]
    solutionSoup.push(...errors)
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
      getScriptContent({ problemSoup, solutionSoup, userMessage }),
    ),
  )
}
