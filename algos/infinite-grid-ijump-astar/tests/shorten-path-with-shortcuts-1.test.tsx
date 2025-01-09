import { expect, test } from "bun:test"
import { getPathComparisonSvg } from "./fixtures/get-path-comparison-svg"
import { shortenPathWithShortcuts } from "../v2/lib/shortenPathWithShortcuts"

test("shorten-path-with-shortcuts 1: simple shortcut", () => {
  const pathToOptimize: Array<{ x: number; y: number; layer: string }> = [
    {
      x: 0.5337907000000003,
      y: -1.9547412999999993,
      layer: "top",
    },
    {
      x: 0.5337907000000003,
      y: 1.8952587000000007,
      layer: "top",
    },
    {
      x: 0.38379070000000026,
      y: 1.8952587000000007,
      layer: "top",
    },
    {
      x: 0.38379070000000026,
      y: 1.3380508589999995,
      layer: "top",
    },
    {
      x: -0.5337907000000003,
      y: 1.3380508589999995,
      layer: "top",
    },
    {
      x: -0.5337907000000003,
      y: 1.8958051999999994,
      layer: "top",
    },
  ]

  const simplifiedPath = shortenPathWithShortcuts(pathToOptimize, () => false)

  expect(
    getPathComparisonSvg({
      pathWithLoop: pathToOptimize,
      simplifiedPath,
    }),
  ).toMatchSvgSnapshot(import.meta.path)
})
