import { test, expect } from "bun:test"
import { removePathLoops } from "../../lib/solver-postprocessing/remove-path-loops"
import type { Point } from "autorouting-dataset/lib/types"

test("removePathLoops removes loops from path", () => {
  const path: Point[] = [
    { x: 0, y: 0 },
    { x: 0, y: 5 },
    { x: -3, y: 5 },
    { x: -3, y: 3 },
    { x: 3, y: 3 },
    { x: 3, y: 6 },
  ]

  const shortenedPath = removePathLoops(path)

  expect(shortenedPath).toEqual([
    { x: 0, y: 0 },
    { x: 0, y: 3 },
    { x: 3, y: 3 },
    { x: 3, y: 6 },
  ])
})
