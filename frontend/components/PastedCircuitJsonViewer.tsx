import { PCBViewer } from "@tscircuit/pcb-viewer"
import type { AnyCircuitElement as AnySoupElement } from "circuit-json"
import { useState } from "react"
import { ErrorBoundary } from "react-error-boundary"

export const PastedCircuitJsonViewer = ({
  soup,
}: {
  soup: AnySoupElement[]
}) => {
  const [solutionSoup, setSolutionSoup] = useState<AnySoupElement[]>()
  const [selectedSolver, setSelectedSolver] = useState(
    window.AVAILABLE_SOLVERS?.[0] ?? "simple-grid",
  )

  const handleSolve = async () => {
    const response = await fetch(`/solve?solver=${selectedSolver}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        problem_soup: soup,
      }),
    })
    const { solution_soup } = await response.json()
    setSolutionSoup(solution_soup)
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
        <select
          value={selectedSolver}
          onChange={(e) => setSelectedSolver(e.target.value)}
        >
          {(window.AVAILABLE_SOLVERS || ["simple-grid"]).map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
        <button onClick={handleSolve}>Solve</button>
      </div>
      <div style={{ display: "flex", gap: 20 }}>
        <div style={{ flex: 1 }}>
          <h3>Problem</h3>
          <ErrorBoundary
            fallbackRender={({ error }) => (
              <div>Error rendering problem: {error.message}</div>
            )}
          >
            <PCBViewer
              initialState={{
                is_showing_rats_nest: true,
              }}
              soup={soup}
            />
          </ErrorBoundary>
        </div>
        <div style={{ flex: 1 }}>
          <h3>Solution</h3>
          <ErrorBoundary
            fallbackRender={({ error }) => (
              <div>Error rendering solution: {error.message}</div>
            )}
          >
            {solutionSoup ? (
              <PCBViewer soup={[...soup, ...solutionSoup]} />
            ) : (
              <div>Click solve to see solution</div>
            )}
          </ErrorBoundary>
        </div>
      </div>
    </div>
  )
}
