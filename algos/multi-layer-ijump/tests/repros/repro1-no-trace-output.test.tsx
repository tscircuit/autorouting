import { MultilayerIjump } from "algos/multi-layer-ijump/MultilayerIjump"
import { test, expect } from "bun:test"

const autorouterParams = {
  OBSTACLE_MARGIN: 0.3,
  isRemovePathLoopsEnabled: true,
  layerCount: 2,
  input: {
    obstacles: [
      {
        type: "rect",
        layers: ["top"],
        center: {
          x: -2.15,
          y: 1.905,
        },
        width: 1,
        height: 0.6,
        connectedTo: ["pcb_smtpad_0", "connectivity_net15"],
      },
      {
        type: "rect",
        layers: ["top"],
        center: {
          x: -2.15,
          y: 0.635,
        },
        width: 1,
        height: 0.6,
        connectedTo: ["pcb_smtpad_1", "connectivity_net17"],
      },
      {
        type: "rect",
        layers: ["top"],
        center: {
          x: -2.15,
          y: -0.635,
        },
        width: 1,
        height: 0.6,
        connectedTo: ["pcb_smtpad_2", "connectivity_net19"],
      },
      {
        type: "rect",
        layers: ["top"],
        center: {
          x: -2.15,
          y: -1.905,
        },
        width: 1,
        height: 0.6,
        connectedTo: ["pcb_smtpad_3", "connectivity_net56"],
      },
      {
        type: "rect",
        layers: ["top"],
        center: {
          x: 2.15,
          y: -1.905,
        },
        width: 1,
        height: 0.6,
        connectedTo: ["pcb_smtpad_4", "connectivity_net57"],
      },
      {
        type: "rect",
        layers: ["top"],
        center: {
          x: 2.15,
          y: -0.635,
        },
        width: 1,
        height: 0.6,
        connectedTo: ["pcb_smtpad_5", "connectivity_net58"],
      },
      {
        type: "rect",
        layers: ["top"],
        center: {
          x: 2.15,
          y: 0.635,
        },
        width: 1,
        height: 0.6,
        connectedTo: ["pcb_smtpad_6", "connectivity_net59"],
      },
      {
        type: "rect",
        layers: ["top"],
        center: {
          x: 2.15,
          y: 1.905,
        },
        width: 1,
        height: 0.6,
        connectedTo: ["pcb_smtpad_7", "connectivity_net22"],
      },
      {
        type: "rect",
        layers: ["top"],
        center: {
          x: -4,
          y: 0.5,
        },
        width: 0.6000000000000001,
        height: 0.6000000000000001,
        connectedTo: ["pcb_smtpad_8", "connectivity_net17"],
      },
      {
        type: "rect",
        layers: ["top"],
        center: {
          x: -4,
          y: -0.5,
        },
        width: 0.6000000000000001,
        height: 0.6000000000000001,
        connectedTo: ["pcb_smtpad_9", "connectivity_net15"],
      },
      {
        type: "rect",
        layers: ["top"],
        center: {
          x: 4,
          y: 0.85,
        },
        width: 1,
        height: 1,
        connectedTo: ["pcb_smtpad_10", "connectivity_net15"],
      },
      {
        type: "rect",
        layers: ["top"],
        center: {
          x: 4,
          y: -0.85,
        },
        width: 1,
        height: 1,
        connectedTo: ["pcb_smtpad_11", "connectivity_net22"],
      },
      {
        type: "oval",
        layers: ["top", "inner1", "inner2", "bottom"],
        center: {
          x: -3.8099998780800037,
          y: -4,
        },
        width: 1.2,
        height: 1.2,
        connectedTo: ["pcb_plated_hole_0", "connectivity_net15"],
      },
      {
        type: "oval",
        layers: ["top", "inner1", "inner2", "bottom"],
        center: {
          x: -1.269999959360001,
          y: -4,
        },
        width: 1.2,
        height: 1.2,
        connectedTo: ["pcb_plated_hole_1", "connectivity_net17"],
      },
      {
        type: "oval",
        layers: ["top", "inner1", "inner2", "bottom"],
        center: {
          x: 1.2699999593600015,
          y: -4,
        },
        width: 1.2,
        height: 1.2,
        connectedTo: ["pcb_plated_hole_2", "connectivity_net19"],
      },
      {
        type: "oval",
        layers: ["top", "inner1", "inner2", "bottom"],
        center: {
          x: 3.8099998780800037,
          y: -4,
        },
        width: 1.2,
        height: 1.2,
        connectedTo: ["pcb_plated_hole_3", "connectivity_net22"],
      },
    ],
    connections: [
      {
        name: "connectivity_net17",
        pointsToConnect: [
          {
            x: -4,
            y: 0.5,
            layers: ["top"],
            layer: "top",
          },
          {
            x: -2.15,
            y: 0.635,
            layers: ["top"],
            layer: "top",
          },
        ],
      },
    ],
    layerCount: 2,
    bounds: {
      minX: -6,
      maxX: -0.1499999999999999,
      minY: -1.5,
      maxY: 2.635,
    },
  },
}

test("repro1: no trace output", () => {
  const autorouter = new MultilayerIjump(autorouterParams as any)
  const solution = autorouter.solveAndMapToTraces()
  expect(solution).toHaveLength(1)
})
