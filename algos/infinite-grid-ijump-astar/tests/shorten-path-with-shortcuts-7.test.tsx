import { expect, test } from "bun:test"
import { getPathComparisonSvg } from "./fixtures/get-path-comparison-svg"
import { shortenPathWithShortcuts } from "../v2/lib/shortenPathWithShortcuts"
import { isPointInsideObstacle, type Obstacle } from "solver-utils"
import { ObstacleList } from "../v2/lib/ObstacleList"
import { MultilayerIjump } from "../v2"
import { getSvgFromGraphicsObject } from "graphics-debug"
import { isObstacleBetweenPoints } from "./isObstacleBetweenPoints"

const repro6Input = {
  minTraceWidth: 0.1,
  obstacles: [
    {
      center: { x: -1, y: -1 },
      width: 1,
      height: 1,
    },
  ],
  connections: [
    {
      name: "source_trace_0",
      pointsToConnect: [
        {
          x: -3.4662092999999996,
          y: -1.9547412999999993,
          layer: "top",
        },
        {
          x: -1.15,
          y: 0.29999999999999993,
          layer: "top",
        },
      ],
    },
  ],
  bounds: {
    minX: -6.4337907,
    maxX: 3.05,
    minY: -4,
    maxY: 3.03,
  },
  layerCount: 1,
}

test("shorten-path-with-shortcuts 7 repro", () => {
  const obstacles = repro6Input.obstacles
  const obstacleList = new ObstacleList(obstacles as Obstacle[])

  const pathToOptimize = [
    {
      route_type: "wire",
      x: -3.4662092999999996,
      y: -1.9547412999999993,
      width: 0.1,
      layer: "top",
    },
    {
      route_type: "wire",
      x: -1.15,
      y: -1.9547412999999993,
      width: 0.1,
      layer: "top",
    },
    {
      route_type: "wire",
      x: -1.15,
      y: -1.75,
      width: 0.1,
      layer: "top",
    },
    {
      route_type: "wire",
      x: -2.25,
      y: -1.75,
      width: 0.1,
      layer: "top",
    },
    {
      route_type: "wire",
      x: -2.25,
      y: 0.2999999999999998,
      width: 0.1,
      layer: "top",
    },
    {
      route_type: "wire",
      x: -1.3499999999999996,
      y: 0.2999999999999998,
      width: 0.1,
      layer: "top",
    },
  ]

  const shortenedPath = shortenPathWithShortcuts(
    pathToOptimize as any,
    (A, B) => isObstacleBetweenPoints(A, B, obstacleList),
  )

  expect(
    getPathComparisonSvg(
      {
        pathWithLoop: pathToOptimize as any,
        simplifiedPath: shortenedPath,
      },
      obstacles,
    ),
  ).toMatchSvgSnapshot(import.meta.path, "shorten-path-with-shortcuts-7-normal")
})
