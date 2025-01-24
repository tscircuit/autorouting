import { test, expect } from "bun:test"
import type { AnyCircuitElement as AnySoupElement } from "circuit-json"
import circuitJson from "./get-simple-route-json1-circuit.json"
import { getSimpleRouteJson } from "solver-utils"

test("test that traces that are already connected are not included in the simple route json", () => {
  const simpleRouteJson = getSimpleRouteJson(circuitJson as any)

  // There were 2 source traces, but one was already routed, so there should only
  // be 1 connection in the simple route json
  expect(simpleRouteJson.connections.length).toEqual(1)
})
