import { expect, test } from "bun:test"
import { getPathComparisonSvg } from "./fixtures/get-path-comparison-svg"
import { shortenPathWithShortcuts } from "../v2/lib/shortenPathWithShortcuts"
import { isPointInsideObstacle, type Obstacle } from "solver-utils"
import { ObstacleList } from "../v2/lib/ObstacleList"
import { MultilayerIjump } from "../v2"
import { getSvgFromGraphicsObject } from "graphics-debug"
import { isObstacleBetweenPoints } from "./isObstacleBetweenPoints"

const repro6Input = {
  minTraceWidth: 0.01,
  obstacles: [
    {
      type: "rect",
      layers: ["top"],
      center: {
        x: 0,
        y: 0,
      },
      width: 1.6,
      height: 1,
      connectedTo: [],
    },
    {
      type: "rect",
      layers: ["top"],
      center: {
        x: -0.8,
        y: -0.63,
      },
      width: 0,
      height: 0.2,
      connectedTo: [],
    },
    {
      type: "rect",
      layers: ["top"],
      center: {
        x: -0.8,
        y: 0.63,
      },
      width: 0.2,
      height: 0.2,
      connectedTo: [],
    },
    {
      type: "rect",
      layers: ["top"],
      center: {
        x: 0,
        y: 0,
      },
      width: 1.128735482,
      height: 0.6469371999999964,
      connectedTo: [],
    },
    {
      type: "rect",
      layers: ["top"],
      center: {
        x: 0,
        y: 0,
      },
      width: 0.4999960000000012,
      height: 1.1238982820000005,
      connectedTo: [],
    },
    {
      type: "rect",
      layers: ["top"],
      center: {
        x: 0,
        y: 0,
      },
      width: 0.4999960000000012,
      height: 1.1238982820000005,
      connectedTo: [],
    },
    {
      type: "rect",
      layers: ["top"],
      center: {
        x: 0,
        y: 0,
      },
      width: 0.8400173000000031,
      height: 1.1587354820000004,
      connectedTo: [],
    },
    {
      type: "rect",
      layers: ["top"],
      center: {
        x: -1.1,
        y: 0.30000000000000004,
      },
      width: 0.4,
      height: 0.1,
      connectedTo: [],
    },
    {
      type: "rect",
      layers: ["top"],
      center: {
        x: -1.1,
        y: 0.10000000000000003,
      },
      width: 0.4,
      height: 0.1,
      connectedTo: [],
    },
    {
      type: "rect",
      layers: ["top"],
      center: {
        x: -1.1,
        y: -0.09999999999999998,
      },
      width: 0.4,
      height: 0.1,
      connectedTo: [],
    },
    {
      type: "rect",
      layers: ["top"],
      center: {
        x: -1.1,
        y: -0.30000000000000004,
      },
      width: 0.4,
      height: 0.1,
      connectedTo: [],
    },
    {
      type: "rect",
      layers: ["top"],
      center: {
        x: 1.1,
        y: -0.30000000000000004,
      },
      width: 0.4,
      height: 0.1,
      connectedTo: [],
    },
    {
      type: "rect",
      layers: ["top"],
      center: {
        x: 1.1,
        y: -0.10000000000000003,
      },
      width: 0.4,
      height: 0.1,
      connectedTo: [],
    },
    {
      type: "rect",
      layers: ["top"],
      center: {
        x: 1.1,
        y: 0.09999999999999998,
      },
      width: 0.4,
      height: 0.1,
      connectedTo: [],
    },
    {
      type: "rect",
      layers: ["top"],
      center: {
        x: 1.1,
        y: 0.30000000000000004,
      },
      width: 0.4,
      height: 0.1,
      connectedTo: [],
    },
    {
      type: "rect",
      layers: ["top"],
      center: {
        x: -0.4362093,
        y: -0.004432900000001183,
      },
      width: 0.4,
      height: 0.1,
      connectedTo: [],
    },
    {
      type: "rect",
      layers: ["top"],
      center: {
        x: 0.4362093,
        y: -0.004886400000003732,
      },
      width: 0.4,
      height: 0.1,
      connectedTo: [],
    },
    {
      type: "rect",
      layers: ["top"],
      center: {
        x: -0.4337907000000003,
        y: 0.045805199999999324,
      },
      width: 0.4,
      height: 0.1,
      connectedTo: [],
    },
    {
      type: "rect",
      layers: ["top"],
      center: {
        x: 0.4337907000000003,
        y: 0.04525870000000065,
      },
      width: 0.4,
      height: 0.1,
      connectedTo: [],
    },
    {
      type: "rect",
      layers: ["top"],
      center: {
        x: -0.4337907000000003,
        y: 0.045805199999999324,
      },
      width: 0.4,
      height: 0.1,
      connectedTo: [],
    },
    {
      type: "rect",
      layers: ["top"],
      center: {
        x: 0.4337907000000003,
        y: 0.04525870000000065,
      },
      width: 0.4,
      height: 0.1,
      connectedTo: [],
    },
    {
      type: "rect",
      layers: ["top"],
      center: {
        x: -0.45120930000000026,
        y: 0.016380250000000984,
      },
      width: 0.4,
      height: 0.1,
      connectedTo: [],
    },
    {
      type: "rect",
      layers: ["top"],
      center: {
        x: 0.45120930000000026,
        y: 0.016926950000000218,
      },
      width: 0.4,
      height: 0.1,
      connectedTo: [],
    },
    {
      type: "rect",
      layers: ["top"],
      center: {
        x: 1.2000000000000002,
        y: 0.30000000000000004,
      },
      width: 0.30000000000000004,
      height: 0.2,
      connectedTo: [],
    },
    {
      type: "rect",
      layers: ["top"],
      center: {
        x: -1.2000000000000002,
        y: 0.30000000000000004,
      },
      width: 0.30000000000000004,
      height: 0.2,
      connectedTo: [],
    },
    {
      type: "rect",
      layers: ["top"],
      center: {
        x: -0.5337907000000003,
        y: 0.045805199999999324,
      },
      width: 0.30000000000000004,
      height: 0.2,
      connectedTo: [],
    },
  ],
  connections: [
    {
      name: "source_trace_3",
      pointsToConnect: [
        {
          x: 0.5337907000000003,
          y: 0.04525870000000065,
          layer: "top",
        },
        {
          x: 1.2000000000000002,
          y: 0.09999999999999998,
          layer: "top",
        },
      ],
    },
  ],
  bounds: {
    minX: -3.2,
    maxX: 3.2,
    minY: -2.63,
    maxY: 2.63,
  },
  layerCount: 1,
}

test("shorten-path-with-shortcuts 6 repro", () => {
  const obstacles = repro6Input.obstacles
  const obstacleList = new ObstacleList(obstacles as Obstacle[])

  const pathToOptimize = [
    { x: 0.5337907000000003, y: 0.04525870000000065, layer: "top" },
    { x: 0.8000000000000002, y: 0.04525870000000065, layer: "top" },
    { x: 0.8000000000000002, y: -1.15, layer: "top" },
    { x: 1.2000000000000002, y: -1.15, layer: "top" },
    { x: 1.2000000000000002, y: -0.45000000000000007, layer: "top" },
    { x: 1.4000000000000001, y: -0.45000000000000007, layer: "top" },
    { x: 1.4000000000000001, y: 0.09999999999999998, layer: "top" },
  ]

  // const shortenedPath = shortenPathWithShortcuts(
  //   pathToOptimize as any,
  //   (A, B) => isObstacleBetweenPoints(A, B, obstacleList),
  // )

  // expect(
  //   getPathComparisonSvg(
  //     {
  //       pathWithLoop: pathToOptimize as any,
  //       simplifiedPath: shortenedPath,
  //     },
  //     obstacles,
  //   ),
  // ).toMatchSvgSnapshot(import.meta.path, "shorten-path-with-shortcuts-6-normal")

  const rotatedPathToOptimize = pathToOptimize.map((p) => ({
    x: p.y,
    y: p.x,
    layer: p.layer,
  }))

  const rotatedObstacles = obstacles.map((o) => ({
    ...o,
    center: { x: o.center.y, y: o.center.x },
    width: o.height,
    height: o.width,
  }))

  const rotatedObstacleList = new ObstacleList(rotatedObstacles as Obstacle[])

  const rotatedShortenedPath = shortenPathWithShortcuts(
    rotatedPathToOptimize as any,
    (A, B) => isObstacleBetweenPoints(A, B, rotatedObstacleList),
  )

  expect(
    getPathComparisonSvg(
      {
        pathWithLoop: rotatedPathToOptimize as any,
        simplifiedPath: rotatedShortenedPath,
      },
      rotatedObstacles,
    ),
  ).toMatchSvgSnapshot(
    import.meta.path,
    "shorten-path-with-shortcuts-6-rotated",
  )
})
