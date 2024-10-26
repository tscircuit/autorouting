import { Circuit } from "@tscircuit/core"
import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import { getSimpleRouteJson } from "solver-utils"
import { IJumpMultiMarginAutorouter } from "../v2/lib/IJumpMultiMarginAutorouter"
import { getDebugSvg } from "./fixtures/get-debug-svg"
import { removePathLoops } from "solver-postprocessing/remove-path-loops"
import { getPathComparisonSvg } from "./fixtures/get-path-comparison-svg"

test("remove-path-loops 2: simple loop", () => {
  /**
   * Ascii art of the path:
   *     ......
   *     .    .
   * ..........
   *     .
   *     .
   */
  // Create a path with an intentional loop
  const pathWithLoop: Array<{ x: number; y: number; layer: string }> = [
    { x: 0, y: 0, layer: "top" },
    { x: 5, y: 0, layer: "top" },
    { x: 5, y: 3, layer: "top" },
    { x: 5, y: 3, layer: "top" },
    { x: 3, y: 3, layer: "top" },
    { x: 3, y: 3, layer: "bottom" },
    { x: 3, y: -3, layer: "bottom" },
  ]

  const simplifiedPath = removePathLoops(pathWithLoop)

  expect(
    getPathComparisonSvg({
      pathWithLoop,
      simplifiedPath,
    }),
  ).toMatchSvgSnapshot(import.meta.path)
})
