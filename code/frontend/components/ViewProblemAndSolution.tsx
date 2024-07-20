import { PCBViewer } from "@tscircuit/pcb-viewer"
import type { AnySoupElement } from "@tscircuit/soup"
import { useState } from "react"
import { DatasetNavigation } from "./DatasetNavigation"

declare global {
  interface Window {
    PROBLEM_SOUP: AnySoupElement[]
    SOLUTION_SOUP: AnySoupElement[]
    HAS_SOLVER?: string
  }
}

export default () => {
  const hasPreloadedSoup = Boolean(window.PROBLEM_SOUP || window.SOLUTION_SOUP)
  const hasSolver = Boolean(window.HAS_SOLVER)
  const [pastedSoup, setPastedSoup] = useState<AnySoupElement[]>()
  // Derive problem from url (if present)
  const [, , selectedProblemType, seedStr] = window.location.pathname.split("/")
  const seed = seedStr ? Number.parseInt(seedStr) : 0

  if (!hasPreloadedSoup) {
    return (
      <div>
        {!pastedSoup ? (
          <>
            <DatasetNavigation />
            <h2>No soup preloaded, paste soup json below to display it</h2>
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
            <PCBViewer soup={pastedSoup} />
          </div>
        )}
      </div>
    )
  }

  return (
    <div>
      <DatasetNavigation />
      <div>Problem</div>

      <div>Solution</div>
    </div>
  )
}
