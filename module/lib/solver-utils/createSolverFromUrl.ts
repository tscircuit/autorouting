import type { ProblemSolver } from "./ProblemSolver"
import type { AnySoupElement } from "@tscircuit/soup"
import { getSimpleRouteJson } from "./getSimpleRouteJson"

export const createSolverFromUrl = (solverUrl: string): ProblemSolver => {
  return async (problemSoup: AnySoupElement[]): Promise<AnySoupElement[]> => {
    const simple_route_json = await getSimpleRouteJson(problemSoup)
    const response = await fetch(solverUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ problem_soup: problemSoup, simple_route_json }),
    })
    const data = await response.json()
    return data.solution_soup
  }
}
