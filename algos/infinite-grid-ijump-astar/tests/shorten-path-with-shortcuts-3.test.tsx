import { expect, test } from "bun:test"
import { getPathComparisonSvg } from "./fixtures/get-path-comparison-svg"
import { shortenPathWithShortcuts } from "../v2/lib/shortenPathWithShortcuts"
import { isPointInsideObstacle, type Obstacle } from "solver-utils"
import { ObstacleList } from "../v2/lib/ObstacleList"

test("shorten-path-with-shortcuts 3 with obstacle", () => {
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

  const obstacles = [
    {
      type: "rectangle",
      center: { x: 0.46, y: 1.1 },
      width: 0.1,
      height: 1,
    },
  ]
  const obstacleList = new ObstacleList(obstacles as Obstacle[])

  const simplifiedPath = shortenPathWithShortcuts(pathToOptimize, (A, B) => {
    const minX = Math.min(A.x, B.x)
    const minY = Math.min(A.y, B.y)
    const maxX = Math.max(A.x, B.x)
    const maxY = Math.max(A.y, B.y)
    return (
      obstacleList.getObstaclesOverlappingRegion({
        minX,
        minY,
        maxX,
        maxY,
      }).length > 0
    )
  })

  expect(
    getPathComparisonSvg(
      {
        pathWithLoop: pathToOptimize,
        simplifiedPath,
      },
      obstacles,
    ),
  ).toMatchSvgSnapshot(import.meta.path)
})
