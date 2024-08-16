import { PCBViewer } from "@tscircuit/pcb-viewer"
import type { AnySoupElement } from "@tscircuit/soup"
import { useState } from "react"
import { DatasetNavigation } from "./DatasetNavigation"
import { ErrorBoundary } from "react-error-boundary"
import { Header } from "./Header"

export default () => {
  const hasPreloadedSoup = Boolean(window.PROBLEM_SOUP || window.SOLUTION_SOUP)
  const hasSolver = Boolean(window.HAS_CUSTOM_SOLVER)
  const [selectedDebugSolution, setSelectedDebugSolution] = useState<
    null | string
  >(null)
  const [pastedSoup, setPastedSoup] = useState<AnySoupElement[]>()
  // Derive problem from url (if present)
  const [, , selectedProblemType, seedStr] = window.location.pathname.split("/")
  const seed = seedStr ? Number.parseInt(seedStr) : 0
  const problemSoup = window.PROBLEM_SOUP
  const solutionSoup = window.SOLUTION_SOUP

  if (!hasPreloadedSoup) {
    return (
      <div>
        {!pastedSoup ? (
          <>
            <Header />
            <h1>autorouting-dataset</h1>
            <p>
              You're viewing the{" "}
              <a href="https://github.com/tscircuit/autorouting-dataset">
                autorouting-dataset
              </a>
              . Click a dataset below to explore it.
            </p>
            <DatasetNavigation />
            <h2>
              No circuit json preloaded, click a dataset above or paste circuit
              json (soup) below to display it
            </h2>
            <textarea
              style={{ minWidth: "50vw", minHeight: "50vh" }}
              onChange={(e) => {
                if (e.target.value.length > 10) {
                  try {
                    setPastedSoup(JSON.parse(e.target.value))
                  } catch (e) {
                    console.log("Error parsing soup json", e)
                  }
                }
              }}
            />
          </>
        ) : (
          <div style={{ width: "100vw", height: "100vh" }}>
            <ErrorBoundary
              fallbackRender={({ error }) => (
                <div>Error rendering problem: {error.message}</div>
              )}
            >
              <PCBViewer
                initialState={{
                  is_showing_rats_nest: true,
                }}
                soup={pastedSoup}
              />
            </ErrorBoundary>
          </div>
        )}
      </div>
    )
  }

  const solverElm = window.SOLVER_LINK ? (
    <a
      href={window.SOLVER_LINK}
    >{`[solver: ${window.SOLVER_NAME ?? "???"}]`}</a>
  ) : (
    <span>{`[solver: ${window.SOLVER_NAME ?? "???"}]`}</span>
  )

  return (
    <div>
      <Header />
      <DatasetNavigation />
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <div style={{ flex: 1, marginRight: "10px" }}>
          <h2 style={{ fontSize: 18 }}>Problem</h2>
          {problemSoup ? (
            <PCBViewer
              initialState={{
                is_showing_rats_nest: true,
              }}
              soup={problemSoup}
            />
          ) : (
            "No problem preloaded"
          )}
        </div>
        <div style={{ flex: 1, marginLeft: "10px" }}>
          <h2 style={{ display: "flex", alignItems: "center", fontSize: 18 }}>
            <div>
              Solution {solverElm}
              <div
                style={{
                  backgroundColor: window.IS_SOLUTION_CORRECT ? "green" : "red",
                  color: "white",
                  padding: "2px",
                  borderRadius: 4,
                  paddingLeft: 4,
                  paddingRight: 4,
                  marginRight: "5px",
                  fontFamily: "sans-serif",
                  fontWeight: "bold",
                  display: "inline-block",
                  fontSize: 12,
                }}
              >
                {window.IS_SOLUTION_CORRECT ? "CORRECT" : "WRONG"}
              </div>
              {window.SOLUTION_COMPUTE_TIME && (
                <div
                  style={{
                    backgroundColor: "rgba(0,0,0,0.8)",
                    color: "white",
                    padding: "2px",
                    borderRadius: 4,
                    paddingLeft: 4,
                    paddingRight: 4,
                    marginRight: "5px",
                    fontFamily: "sans-serif",
                    fontWeight: "bold",
                    display: "inline-block",
                    fontSize: 12,
                  }}
                >
                  {window.SOLUTION_COMPUTE_TIME.toFixed(1)}ms
                </div>
              )}
            </div>
            <a href={`/problem/${selectedProblemType}/${seed}.solution.json`}>
              download (json)
            </a>
            <div style={{ flexGrow: 1 }} />
            {window.DEBUG_SOLUTIONS && (
              <select
                onChange={(e) => {
                  const selectionValue = (e.target as HTMLSelectElement).value
                  if (selectionValue === "main solution") {
                    setSelectedDebugSolution(null)
                    return
                  }
                  setSelectedDebugSolution(selectionValue)
                }}
              >
                <option value="main solution">main solution</option>
                {Object.keys(window.DEBUG_SOLUTIONS).map((key) => (
                  <option
                    value={key}
                    key={key}
                    disabled={window.DEBUG_SOLUTIONS?.[key].length === 0}
                  >
                    {key}
                  </option>
                ))}
              </select>
            )}
          </h2>
          <ErrorBoundary
            fallbackRender={({ error }) => (
              <div>Error rendering solution: {error.message}</div>
            )}
          >
            {selectedDebugSolution ? (
              <PCBViewer
                key={selectedDebugSolution}
                initialState={{
                  selected_layer: "bottom" as any,
                }}
                soup={problemSoup.concat(
                  window.DEBUG_SOLUTIONS![selectedDebugSolution as any],
                )}
              />
            ) : solutionSoup ? (
              <PCBViewer key="main solution" soup={solutionSoup} />
            ) : (
              "No solution preloaded"
            )}
          </ErrorBoundary>
          <div style={{ whiteSpace: "pre-wrap" }}>{window.DEBUG_MESSAGE}</div>
        </div>
      </div>
    </div>
  )
}
