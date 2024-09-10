import { test, expect } from "bun:test"
import { getObstaclesFromCircuitJson } from "../../lib/solver-utils/getObstaclesFromCircuitJson"
import type { AnySoupElement } from "@tscircuit/soup"

test("pcb_trace becomes an obstacle correctly", () => {
  const soupWithTrace: AnySoupElement[] = [
    {
      type: "pcb_trace",
      pcb_trace_id: "trace1",
      source_trace_id: "trace1",
      route: [
        { x: 0, y: 0, route_type: "wire", width: 0.1, layer: "top" },
        { x: 10, y: 0, route_type: "wire", width: 0.1, layer: "top" },
        { x: 10, y: 10, route_type: "wire", width: 0.1, layer: "top" },
      ],
    },
  ]

  const obstacles = getObstaclesFromCircuitJson(soupWithTrace)

  expect(obstacles).toHaveLength(2)

  // Check the first obstacle (horizontal trace)
  expect(obstacles[0]).toEqual({
    type: "rect",
    center: { x: 5, y: 0 },
    width: 10,
    height: 0.1,
    layers: ["top"],
    connectedTo: ["trace1"],
  })

  // Check the second obstacle (vertical trace)
  expect(obstacles[1]).toEqual({
    type: "rect",
    layers: ["top"],
    center: { x: 10, y: 5 },
    width: 0.1,
    height: 10,
    connectedTo: ["trace1"],
  })
})
