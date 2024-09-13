import { test, expect } from "bun:test"
import { removePathLoops } from "../../lib/solver-postprocessing/remove-path-loops"
import type { PointWithLayer } from "algos/infinite-grid-ijump-astar/v2/lib/GeneralizedAstar"

test("removePathLoops removes loops from path", () => {
  const path: PointWithLayer[] = [
    { x: 0, y: 0, layer: "top" },
    { x: 0, y: 5, layer: "top" },
    { x: -3, y: 5, layer: "top" },
    { x: -3, y: 3, layer: "top" },
    { x: 3, y: 3, layer: "top" },
    { x: 3, y: 6, layer: "top" },
  ]

  const shortenedPath = removePathLoops(path)

  expect(shortenedPath).toEqual([
    { x: 0, y: 0, layer: "top" },
    { x: 0, y: 3, layer: "top" },
    { x: 3, y: 3, layer: "top" },
    { x: 3, y: 6, layer: "top" },
  ])
})

test("removePathLoops does not remove loops from path where the loop has a layer change", () => {
  const path: PointWithLayer[] = [
    { x: 0, y: 0, layer: "top" },
    { x: 0, y: 5, layer: "top" },
    { x: -3, y: 5, layer: "bottom" },
    { x: -3, y: 3, layer: "bottom" },
    { x: 3, y: 3, layer: "bottom" },
    { x: 3, y: 6, layer: "bottom" },
  ]

  const shortenedPath = removePathLoops(path)

  expect(shortenedPath).toEqual(path)
})
