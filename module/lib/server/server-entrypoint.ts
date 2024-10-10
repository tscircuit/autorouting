// @ts-ignore
import frontend from "../../../frontend-dist/index.html" with { type: "text" }
// @ts-ignore
import frontendJs from "../../../frontend-dist/assets/index.js" with {
  type: "text",
}
import { getScriptContent } from "./get-script-content"
import { getDatasetGenerator } from "../generators"
import type { LayerRef } from "@tscircuit/soup"
import type { AnyCircuitElement } from "circuit-json"
import type { AppContext } from "./app-context"
import type { IncomingMessage, ServerResponse } from "node:http"
import {
  checkEachPcbPortConnected,
  checkEachPcbTraceNonOverlapping,
} from "@tscircuit/checks"
import { runChecks } from "../benchmark/run-checks"
import { autoroute as simpleGridSolver } from "../../../algos/simple-grid"
import { isValidSolution } from "../benchmark/is-valid-solution"
import { AVAILABLE_DATASETS } from "./available-datasets"
import getRawBody from "raw-body"
import { getBuiltinAvailableSolver } from "./get-builtin-available-solver"
import { AVAILABLE_SOLVERS } from "./available-solvers"
import { normalizeSolution } from "../solver-utils/normalize-solution.js"
import { addViasWhenLayerChanges } from "../solver-postprocessing/add-vias-when-layer-changes.js"
import { addViasForPcbTraceRoutes } from "../solver-postprocessing/add-vias-for-pcb-trace-routes.js"

export const serverEntrypoint = async (
  req: IncomingMessage,
  res: ServerResponse<IncomingMessage>,
  ctx: AppContext,
) => {
  let { solver = simpleGridSolver } = ctx
  let problemSoup: AnyCircuitElement[] | undefined
  let solutionSoup: AnyCircuitElement[] | undefined
  let userMessage: string | undefined

  // If the url is /problem/single-trace/1/simple-grid, then set the solver
  // to the solver with the name "simple-grid"
  if (req.url!.includes("/problem/")) {
    const [, , , , overrideSolverNameInUrl] = req.url!.split("/")
    if (
      overrideSolverNameInUrl &&
      AVAILABLE_SOLVERS.includes(overrideSolverNameInUrl) &&
      ctx.solverName !== overrideSolverNameInUrl
    ) {
      ctx.solverName = overrideSolverNameInUrl
      solver = (await getBuiltinAvailableSolver(overrideSolverNameInUrl))!
    }
  }

  // Check if "?solver=..." is in the url parameters, if so set it to overrideSolverName
  const urlParams = new URLSearchParams(req.url!.split("?")[1])
  const solverParam = urlParams.get("solver")
  if (solverParam && AVAILABLE_SOLVERS.includes(solverParam)) {
    ctx.solverName = solverParam
    solver = (await getBuiltinAvailableSolver(solverParam))!
  }

  if (req.url!.endsWith("/solve")) {
    // Read request body
    const reqJson = await getRawBody(req, { encoding: "utf-8" })
    const { problem_soup } = JSON.parse(reqJson)
    res.writeHead(200, { "Content-Type": "application/json" })

    const { solution: solution_soup, debugSolutions } = await normalizeSolution(
      solver(problem_soup),
    )

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
  let debugSolutions: Record<string, AnyCircuitElement[]> | undefined
  let debugMessage: string | undefined

  if (problemSoup) {
    const startTime = performance.now()
    try {
      const solverResult = await normalizeSolution(
        solver(problemSoup as AnyCircuitElement[]),
      )
      debugSolutions = solverResult.debugSolutions
      debugMessage = solverResult.debugMessage!

      const endTime = performance.now()
      solutionComputeTime = endTime - startTime

      solutionSoup = solverResult.solution.concat(problemSoup) as any

      addViasForPcbTraceRoutes(solutionSoup as any)
    } catch (e: any) {
      userMessage = `Error running solver: ${e.message}\n\n${e.stack}`
    }
  }

  // Add errors to solutionSoup for overlapping traces etc. (run eval)
  if (solutionSoup) {
    solutionSoup.push(...runChecks(problemSoup!, solutionSoup))
  }

  if (req.url!.includes(".json")) {
    res.writeHead(200, { "Content-Type": "application/json" })
    if (req.url!.includes(".solution.json")) {
      res.writeHead(200, {
        "content-disposition": `attachment; filename=${problemType}${seed}-${ctx.solverName}.solution.json`,
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

  if (req.url!.includes("/assets/index.js")) {
    res.writeHead(200, { "Content-Type": "application/javascript" })
    res.end(frontendJs)
    return
  }

  res.writeHead(200, { "Content-Type": "text/html" })
  res.end(
    frontend.replace(
      "<!-- INJECT_SCRIPT -->",
      getScriptContent({
        problemSoup,
        solutionSoup,
        debugSolutions,
        debugMessage,
        solutionComputeTime,
        userMessage,
        solverName: ctx.solverName,
        defaultSolverName: ctx.defaultSolverName,
        hasCustomSolver: Boolean(ctx.solver),
        isSolutionCorrect: isValidSolution(
          problemSoup as any,
          solutionSoup as any,
        ),
      }),
    ),
  )
}
