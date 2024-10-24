import { PCBViewer } from "@tscircuit/pcb-viewer"
import type {
  AnyCircuitElement as AnySoupElement,
  PcbSmtPad,
  PcbSmtPadRect,
} from "circuit-json"
import { useState } from "react"
import { DatasetNavigation } from "./DatasetNavigation"
import { ErrorBoundary } from "react-error-boundary"
import { Header } from "./Header"
import { PastedCircuitJsonViewer } from "./PastedCircuitJsonViewer"

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
        <Header />
        <h1>tscircuit autorouting</h1>
        {!pastedSoup ? (
          <>
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
              placeholder="Paste Circuit JSON (soup) or Simple Route JSON here..."
              onChange={(e) => {
                if (e.target.value.length > 10) {
                  try {
                    const parsed = JSON.parse(e.target.value)
                    // Check if it's SimpleRouteJson by looking for key properties
                    if (
                      parsed.connections &&
                      parsed.obstacles &&
                      parsed.bounds
                    ) {
                      // Convert SimpleRouteJson to soup format
                      const soup = [
                        // Add board
                        {
                          type: "board",
                          width: parsed.bounds.maxX - parsed.bounds.minX,
                          height: parsed.bounds.maxY - parsed.bounds.minY,
                        },
                        // Add obstacles as keepouts
                        ...parsed.obstacles.map(
                          (obs: any) =>
                            ({
                              type: "pcb_smtpad",
                              shape: "rect",
                              pcb_smtpad_id:
                                obs.id || `smtpad_${Math.random()}`,
                              x: obs.center.x,
                              y: obs.center.y,
                              width: obs.width,
                              height: obs.height,
                              layer: obs.layers ? obs.layers[0] : "top",
                            }) as PcbSmtPadRect,
                        ),
                        // Add connections as source traces and ports
                        ...parsed.connections.flatMap(
                          (conn: any, i: number) => [
                            {
                              type: "source_trace",
                              source_trace_id: conn.name || `trace_${i}`,
                              connected_source_port_ids: [
                                `port_${i}_1`,
                                `port_${i}_2`,
                              ],
                            },
                            {
                              type: "pcb_port",
                              pcb_port_id: `pcb_port_${i}_1`,
                              source_port_id: `port_${i}_1`,
                              x: conn.pointsToConnect[0].x,
                              y: conn.pointsToConnect[0].y,
                              layers: [conn.pointsToConnect[0].layer || "top"],
                            },
                            {
                              type: "pcb_port",
                              pcb_port_id: `pcb_port_${i}_2`,
                              source_port_id: `port_${i}_2`,
                              x: conn.pointsToConnect[1].x,
                              y: conn.pointsToConnect[1].y,
                              layers: [conn.pointsToConnect[1].layer || "top"],
                            },
                          ],
                        ),
                      ]
                      setPastedSoup(soup)
                    } else {
                      setPastedSoup(parsed)
                    }
                  } catch (e) {
                    console.log("Error parsing json", e)
                  }
                }
              }}
            />
          </>
        ) : (
          <PastedCircuitJsonViewer soup={pastedSoup} />
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
            <a
              href={`/problem/${selectedProblemType}/${seed}.solution.json?solver=${window.SOLVER_NAME}`}
            >
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
