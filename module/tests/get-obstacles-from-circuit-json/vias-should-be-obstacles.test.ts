import { test, expect } from "bun:test"
import { getObstaclesFromCircuitJson } from "../../lib/solver-utils/getObstaclesFromCircuitJson"
import type { AnySoupElement } from "@tscircuit/soup"

test("pcb_via becomes an obstacle correctly", () => {
  const soupWithTrace: AnySoupElement[] = [
    {
      type: "pcb_via",
      hole_diameter: 0.3,
      outer_diameter: 0.5,
      layers: ["top", "bottom"],
      x: 1,
      y: 2,
    },
  ]

  const obstacles = getObstaclesFromCircuitJson(soupWithTrace)

  expect(obstacles).toHaveLength(1)

  expect(obstacles[0]).toEqual({
    type: "rect",
    center: { x: 1, y: 2 },
    width: 0.5,
    height: 0.5,
    layers: ["top", "bottom"],
    connectedTo: [], // TODO pcb_vias can be associated to traces
  })
})
