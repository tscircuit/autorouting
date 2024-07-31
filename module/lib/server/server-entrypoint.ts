// @ts-ignore
import frontend from "../../../frontend-dist/index.html"
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
import { AVAILABLE_DATASETS } from "./available-datasets"
import getRawBody from "raw-body"
import fetch from "node-fetch"

export const serverEntrypoint = async (
  req: IncomingMessage,
  res: ServerResponse<IncomingMessage>,
  ctx: AppContext,
) => {
  const { solver = tscircuitBuiltinSolver } = ctx
  let problemSoup: AnySoupElement[] | undefined
  let solutionSoup: AnySoupElement[] | undefined
  let userMessage: string | undefined

  if (req.url!.endsWith("/solve")) {
    // Read request body
    const reqJson = await getRawBody(req, { encoding: "utf-8" })
    const { problem_soup } = JSON.parse(reqJson)
    res.writeHead(200, { "Content-Type": "application/json" })

    const solution_soup = await solver(problem_soup)

    res.end(
      JSON.stringify(
        {
          solution_soup,
        },
        null,
        2,
      ),
    )
    return
  }

  if (req.url!.includes("/available-datasets.json")) {
    res.writeHead(200, { "Content-Type": "application/json" })
    res.end(JSON.stringify({ available_datasets: AVAILABLE_DATASETS }, null, 2))
    return
  }

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

  let solutionComputeTime: number | undefined
  if (problemSoup) {
    const startTime = performance.now()
    const solvedResult = await solver(problemSoup as AnySoupElement[])
    const endTime = performance.now()
    solutionComputeTime = endTime - startTime

    solutionSoup = solvedResult.concat(problemSoup) as any
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
        solutionComputeTime,
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
