import { expect, test } from "bun:test"
import { getPathComparisonSvg } from "./fixtures/get-path-comparison-svg"
import { shortenPathWithShortcuts } from "../v2/lib/shortenPathWithShortcuts"
import { isPointInsideObstacle, type Obstacle } from "solver-utils"
import { ObstacleList } from "../v2/lib/ObstacleList"

const repro4 = {
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
  trace: {
    type: "schematic_trace",
    schematic_trace_id: "schematic_trace_0",
    source_trace_id: "source_trace_0",
    edges: [
      {
        from: {
          route_type: "wire",
          x: -0.6000000000000001,
          y: -0.5,
          width: 0.01,
          layer: "top",
        },
        to: {
          route_type: "wire",
          x: -0.6000000000000001,
          y: -0.45000000000000007,
          width: 0.01,
          layer: "top",
        },
      },
      {
        from: {
          route_type: "wire",
          x: -0.6000000000000001,
          y: -0.45000000000000007,
          width: 0.01,
          layer: "top",
        },
        to: {
          route_type: "wire",
          x: -0.8500000000000001,
          y: -0.45000000000000007,
          width: 0.01,
          layer: "top",
        },
      },
      {
        from: {
          route_type: "wire",
          x: -0.8500000000000001,
          y: -0.45000000000000007,
          width: 0.01,
          layer: "top",
        },
        to: {
          route_type: "wire",
          x: -0.8500000000000001,
          y: -0.9500000000000002,
          width: 0.01,
          layer: "top",
        },
      },
      {
        from: {
          route_type: "wire",
          x: -0.8500000000000001,
          y: -0.9500000000000002,
          width: 0.01,
          layer: "top",
        },
        to: {
          route_type: "wire",
          x: -0.29999999999999993,
          y: -0.9500000000000002,
          width: 0.01,
          layer: "top",
        },
      },
      {
        from: {
          route_type: "wire",
          x: -0.29999999999999993,
          y: -0.9500000000000002,
          width: 0.01,
          layer: "top",
        },
        to: {
          route_type: "wire",
          x: -0.29999999999999993,
          y: -1.9,
          width: 0.01,
          layer: "top",
        },
      },
      {
        from: {
          route_type: "wire",
          x: -0.29999999999999993,
          y: -1.9,
          width: 0.01,
          layer: "top",
        },
        to: {
          route_type: "wire",
          x: 5.533790700000001,
          y: -1.9,
          width: 0.01,
          layer: "top",
        },
      },
      {
        from: {
          route_type: "wire",
          x: 5.533790700000001,
          y: -1.9,
          width: 0.01,
          layer: "top",
        },
        to: {
          route_type: "wire",
          x: 5.533790700000001,
          y: -0.10474129999999948,
          width: 0.01,
          layer: "top",
        },
      },
      {
        from: {
          route_type: "wire",
          x: 5.533790700000001,
          y: -0.10474129999999948,
          width: 0.01,
          layer: "top",
        },
        to: {
          x: 5.533790700000001,
          y: 0.04525870000000065,
        },
      },
    ],
    junctions: [],
  },
}

test("shorten-path-with-shortcuts 4 repro", () => {
  const obstacles = repro4.obstacles
  const obstacleList = new ObstacleList(obstacles as Obstacle[])
  const pathToOptimize = [
    ...repro4.trace.edges.map((edge) => edge.from),
    repro4.trace.edges[repro4.trace.edges.length - 1].to,
  ]

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
  ).toMatchSvgSnapshot(import.meta.path)
})
