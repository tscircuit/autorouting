# autorouting-dataset

[Problems](#problems) &middot; [Benchmarks](#benchmarks) &middot; [Writing a Solver](#writing-a-solver) &middot; [Usage](#usage) &middot; [Running a Benchmark](#running-a-benchmark) &middot; [tscircuit](https://github.com/tscircuit/tscircuit)

A dataset of autorouting problems for benchmarking. Autorouting
is the drawing of traces (wires) across a 2d surface to connect
copper pads together. Traces can go underneath pads using a
copper-plated hole called a "via". Traces must also avoid "obstacles"
which are other pads or blocked areas where a trace cannot pass
such as a hole or region designated for an antenna.

## Problems

There are different classifications of problems, each problem
applies to a different autorouting scenario. A perfect autorouter
can solve all of these problems, but partial autorouting is
very useful for human-assisted routing.

| Problem | Description | Difficulty |
| ------- | ----------- | ---------- |
| `single-trace` | Route a single trace through obstacles | Easy |
| `single-multi-point-trace` | Route a single trace through multiple points | Easy |
| `traces` | Route multiple traces to pairs of points, without crossing traces | Medium |
| `layers-traces` | Route a trace through multiple layers to connect two points | Easy |
| `traces-groups` | Route multiple traces to groups of points, without crossing traces | Medium |
| `layers-traces` | Route multiple traces to pairs of points, without crossing traces across layers | Hard |
| `layers-traces-groups` | Route multiple traces, through multiple places, to groups of points, without crossing traces | Hard |
| `incremental-*` | The same dataset but a component is moved or a trace is changed. Tests cache efficiency | Hard+ |

## Benchmarks

There are several criteria we use for running benchmarks:

- Speed
- Percent Completed
- Quality
  - Compared to the ideal routing, how much longer are the traces? Shorter traces are usually better
- Problem Type
- Incremental Speed (speed if a single component is moved or a trace is changed)

Over time, we'd like to have a simple 2d chart showing Speed and Quality.


## Usage

This dataset is composed of thousands of files in the [tscircuit soup format](https://docs.tscircuit.com/api-reference/advanced/soup). You
can find a dataset for each problem tscircuit in the [datasets](./datasets) directory. You can download a [`zip` file](#) containing the datasets
from the [releases page](#). If your solver is in typescript, you can generate the datasets on the fly by importing `autorouting-dataset`

soup can be easily visualized and contains a lot of metadata that can be used for constraints. However, you may want to use the `getSimpleRouteJson`
utility function from `autorouting-dataset` to convert it into a simple object with the following interface:

```tsx
interface SimpleRouteJson {
  layerCount: number
  obstacles: Array<{
    type: "rect" | "oval", // NOTE: most datasets do not contain ovals
    center: { x: number, y: number },
    width: number,
    height: number
  }>,
  connections: Array<{
    name: string,
    pointsToConnect: Array<{ x: number, y: number }>
  }>,
  bounds: { minX: number, maxX: number, minY: number, maxY: number }
}
```

Each directory in the `datasets` directory contains a dataset for each problem. The `generate` directory contains the code to generate datasets.


## Writing a Solver

You can write a solver in any language you want, but there is currently first-class support for Typescript solvers.

### Typescript Solvers

Typescript solvers can accept either [tscircuit soup](https://docs.tscircuit.com/api-reference/advanced/soup) or [`SimpleRouteJson`](#usage). To develop
your Typescript solver, just create a file like this:

```tsx
import { startAutoroutingDevServer, getSimpleRouteJson } from "autorouting-dataset"

const mySolver = (soup: AnySoupElement[]) => {
  const routeJson = getSimpleRouteJson(soup)

  // ...

  // ...return a pcb_trace object with our solution!
  return [
    {
      "type": "pcb_trace",
      "route": [
        {
          "route_type": "wire",
          "x": 3,
          "y": 1,
          "width": 5,
          "layer": "top"
        },
        {
          "route_type": "via",
          "x": 3,
          "y": 1,
          "from_layer": "top",
          "to_layer": "bottom"
        }
      ]
    }
  ]

startAutoroutingDevServer({
  solver: mySolver,
  port: 3000
})
```

You can then run this file with `bun --hot ./solver-server.ts`

> [!NOTE]
> We recommend putting the solver in a separate file then importing it inside your server file, this way
> you can easily export your solver as a library!

### Non-Typescript Solvers

* Host a server with your algorithm (see the simple flask server below)
* Run `npx autorouting-dataset server start` and configure the url to your server

```python
# TODO insert flask server here
```


## Visualizing Problems/Solutions

tscircuit runs a debugging service at [debug.tscircuit.com](https://debug.tscircuit.com) that you can use to visualize a solved or unsolved problem,
just follow the instructions of the [logSoup](https://github.com/tscircuit/log-soup) function. If you are using a language other than Typescript,
you can follow the instructions here (TODO)

If you are using Typescript, you may want to visualize your solution incrementally or customize your own visualization. For that, there is an easy-to-use
[RouterPlayground](#) component that allows visualizing your solution.

## Running a Benchmark

If you have a Typescript solver, you can run a benchmark programmatically using:

```tsx
import { runBenchmark } from "autorouting-dataset"
import mySolver from "./my-solver"

const result = await runBenchmark({
  mySolver,
  verbose: true
})

console.log(result)
```
