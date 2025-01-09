import { expect, test } from "bun:test"
import { getPathComparisonSvg } from "./fixtures/get-path-comparison-svg"
import { shortenPathWithShortcuts } from "../v2/lib/shortenPathWithShortcuts"
import { isPointInsideObstacle, type Obstacle } from "solver-utils"
import { ObstacleList } from "../v2/lib/ObstacleList"
import { MultilayerIjump } from "../v2"
import { getSvgFromGraphicsObject } from "graphics-debug"

const repro5Input = {
  minTraceWidth: 0.01,
  obstacles: [
    {
      type: "rect",
      layers: ["top"],
      center: {
        x: 0,
        y: 0,
      },
      width: 0.4,
      height: 1.7999999999999998,
      connectedTo: [],
    },
    {
      type: "rect",
      layers: ["top"],
      center: {
        x: -0.2,
        y: -1.0299999999999998,
      },
      width: 0,
      height: 0.2,
      connectedTo: [],
    },
    {
      type: "rect",
      layers: ["top"],
      center: {
        x: -0.2,
        y: 1.0299999999999998,
      },
      width: 0.2,
      height: 0.2,
      connectedTo: [],
    },
    {
      type: "rect",
      layers: ["top"],
      center: {
        x: 5,
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
        x: -0.5000000000000001,
        y: 0.7,
      },
      width: 0.5,
      height: 0.1,
      connectedTo: [],
    },
    {
      type: "rect",
      layers: ["top"],
      center: {
        x: -0.5000000000000001,
        y: 0.49999999999999994,
      },
      width: 0.5,
      height: 0.1,
      connectedTo: [],
    },
    {
      type: "rect",
      layers: ["top"],
      center: {
        x: -0.5000000000000001,
        y: 0.29999999999999993,
      },
      width: 0.5,
      height: 0.1,
      connectedTo: [],
    },
    {
      type: "rect",
      layers: ["top"],
      center: {
        x: -0.5000000000000001,
        y: 0.09999999999999987,
      },
      width: 0.5,
      height: 0.1,
      connectedTo: [],
    },
    {
      type: "rect",
      layers: ["top"],
      center: {
        x: -0.5000000000000001,
        y: -0.10000000000000009,
      },
      width: 0.5,
      height: 0.1,
      connectedTo: [],
    },
    {
      type: "rect",
      layers: ["top"],
      center: {
        x: -0.5000000000000001,
        y: -0.30000000000000004,
      },
      width: 0.5,
      height: 0.1,
      connectedTo: [],
    },
    {
      type: "rect",
      layers: ["top"],
      center: {
        x: -0.5000000000000001,
        y: -0.5,
      },
      width: 0.5,
      height: 0.1,
      connectedTo: [],
    },
    {
      type: "rect",
      layers: ["top"],
      center: {
        x: -0.5000000000000001,
        y: -0.7,
      },
      width: 0.5,
      height: 0.1,
      connectedTo: [],
    },
    {
      type: "rect",
      layers: ["top"],
      center: {
        x: 0.5000000000000001,
        y: -0.7,
      },
      width: 0.5,
      height: 0.1,
      connectedTo: [],
    },
    {
      type: "rect",
      layers: ["top"],
      center: {
        x: 0.5000000000000001,
        y: -0.49999999999999994,
      },
      width: 0.5,
      height: 0.1,
      connectedTo: [],
    },
    {
      type: "rect",
      layers: ["top"],
      center: {
        x: 0.5000000000000001,
        y: -0.29999999999999993,
      },
      width: 0.5,
      height: 0.1,
      connectedTo: [],
    },
    {
      type: "rect",
      layers: ["top"],
      center: {
        x: 0.5000000000000001,
        y: -0.09999999999999987,
      },
      width: 0.5,
      height: 0.1,
      connectedTo: [],
    },
    {
      type: "rect",
      layers: ["top"],
      center: {
        x: 0.5000000000000001,
        y: 0.10000000000000009,
      },
      width: 0.5,
      height: 0.1,
      connectedTo: [],
    },
    {
      type: "rect",
      layers: ["top"],
      center: {
        x: 0.5000000000000001,
        y: 0.30000000000000004,
      },
      width: 0.5,
      height: 0.1,
      connectedTo: [],
    },
    {
      type: "rect",
      layers: ["top"],
      center: {
        x: 0.5000000000000001,
        y: 0.5,
      },
      width: 0.5,
      height: 0.1,
      connectedTo: [],
    },
    {
      type: "rect",
      layers: ["top"],
      center: {
        x: 0.5000000000000001,
        y: 0.7,
      },
      width: 0.5,
      height: 0.1,
      connectedTo: [],
    },
    {
      type: "rect",
      layers: ["top"],
      center: {
        x: 4.5662093,
        y: 0.045805199999999324,
      },
      width: 0.5,
      height: 0.1,
      connectedTo: [],
    },
    {
      type: "rect",
      layers: ["top"],
      center: {
        x: 5.433790700000001,
        y: 0.04525870000000065,
      },
      width: 0.5,
      height: 0.1,
      connectedTo: [],
    },
  ],
  connections: [
    {
      name: "source_trace_0",
      pointsToConnect: [
        {
          x: -0.6000000000000001,
          y: -0.5,
          layer: "top",
        },
        {
          x: 5.533790700000001,
          y: 0.04525870000000065,
          layer: "top",
        },
      ],
    },
  ],
  bounds: {
    minX: -2.5,
    maxX: 7.433790700000001,
    minY: -3.03,
    maxY: 3.03,
  },
  layerCount: 1,
}

const repro5Output = {
  type: "pcb_trace",
  pcb_trace_id: "pcb_trace_for_source_trace_0",
  route: [
    {
      route_type: "wire",
      x: -0.6000000000000001,
      y: -0.5,
      width: 0.01,
      layer: "top",
    },
    {
      route_type: "wire",
      x: -0.6000000000000001,
      y: -0.45000000000000007,
      width: 0.01,
      layer: "top",
    },
    {
      route_type: "wire",
      x: -0.8500000000000001,
      y: -0.45000000000000007,
      width: 0.01,
      layer: "top",
    },
    {
      route_type: "wire",
      x: -0.8500000000000001,
      y: -0.9500000000000002,
      width: 0.01,
      layer: "top",
    },
    {
      route_type: "wire",
      x: -0.29999999999999993,
      y: -0.9500000000000002,
      width: 0.01,
      layer: "top",
    },
    {
      route_type: "wire",
      x: -0.29999999999999993,
      y: -1.9,
      width: 0.01,
      layer: "top",
    },
    {
      route_type: "wire",
      x: 5.533790700000001,
      y: -1.9,
      width: 0.01,
      layer: "top",
    },
    {
      route_type: "wire",
      x: 5.533790700000001,
      y: -0.10474129999999948,
      width: 0.01,
      layer: "top",
    },
  ],
}

test("shorten-path-with-shortcuts 5 repro", () => {
  const obstacles = repro5Input.obstacles
  const obstacleList = new ObstacleList(obstacles as Obstacle[])
  const pathToOptimize = [...repro5Output.route]

  const simplifiedPath = shortenPathWithShortcuts(
    pathToOptimize as any,
    (A, B) => {
      const collision = obstacleList.getOrthoDirectionCollisionInfo(
        A,
        {
          dx: Math.sign(B.x - A.x),
          dy: Math.sign(B.y - A.y),
        },
        {
          margin: 0.05,
        },
      )
      const dist = Math.sqrt((A.x - B.x) ** 2 + (A.y - B.y) ** 2)
      return collision.wallDistance < dist
    },
  )

  expect(
    getPathComparisonSvg(
      {
        pathWithLoop: pathToOptimize as any,
        simplifiedPath,
      },
      obstacles,
    ),
  ).toMatchSvgSnapshot(
    import.meta.path,
    "shorten-path-with-shortcuts-5-projected",
  )

  const multilayerAutorouter = new MultilayerIjump({
    input: repro5Input as any,
    OBSTACLE_MARGIN: 0.1,
    isRemovePathLoopsEnabled: true,
    isShortenPathWithShortcutsEnabled: true,
  })

  const [result] = multilayerAutorouter.solveAndMapToTraces()

  expect(
    getSvgFromGraphicsObject({
      lines: [
        {
          points: result.route,
        },
      ],
      rects: obstacles,
    }),
  ).toMatchSvgSnapshot(import.meta.path, "shorten-path-with-shortcuts-5-actual")
})
