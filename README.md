# autorouting-dataset

[view online](https://dataset.autorouting.com) &middot; [blog](https://blog.autorouting.com) &middot; [discord](https://tscircuit.com/community/join-redirect) &middot; [tscircuit](https://github.com/tscircuit/tscircuit)

A dataset of autorouting problems for benchmarking 🥇, plus a ton of utilities 🔨 including a viewer and testing server
for developing new autorouting algorithms.

Autorouting is the process of drawing traces (wires) to connect chips on a PCB. It is a decades-old largely unsolved
problem.

![image](https://github.com/user-attachments/assets/bad8e749-1c84-4b6f-bbdf-12bf7e9c3e7b)

- [autorouting-dataset](#autorouting-dataset)
  - [What is autorouting?](#what-is-autorouting)
  - [Problems](#problems)
    - [Example Problems](#example-problems)
      - [`simple-multi-point-trace`](#simple-multi-point-trace)
  - [Benchmarks](#benchmarks)
  - [Usage](#usage)
  - [Writing a Solver](#writing-a-solver)
    - [Typescript Solvers](#typescript-solvers)
    - [Non-Typescript Solvers](#non-typescript-solvers)
  - [Visualizing Problems/Solutions](#visualizing-problemssolutions)
    - [Running a Dev Server with Typescript](#running-a-dev-server-with-typescript)
  - [Running a Benchmark](#running-a-benchmark)
    - [Running Benchmarks with Typescript](#running-benchmarks-with-typescript)
    - [Running Benchmarks without Typescript](#running-benchmarks-without-typescript)
  - [CLI Usage](#cli-usage)
    - [Installation](#installation)
    - [Starting Dev Servers](#starting-dev-servers)
    - [Running Benchmarks](#running-benchmarks)
      - [Customizing Benchmarks](#customizing-benchmarks)
    - [Generating Datasets](#generating-datasets)
  - [Community Solvers](#community-solvers)

## What is autorouting?

Autorouting
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

| Problem                | Ready Status                                                              | Description                                                                                  | Difficulty |
| ---------------------- | ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | ---------- |
| `single-trace`         | [🟢 view](https://dataset.autorouting.com/problem/single-trace/1)         | Route a single trace through obstacles                                                       | Easy       |
| `traces`               | [🟢 view](https://dataset.autorouting.com/problem/traces/1)               | Route multiple traces to pairs of points, without crossing traces                            | Medium     |
| `distant-single-trace` | [🟢 view](https://dataset.autorouting.com/problem/distant-single-trace/1) | Long (200mm+) single trace                                                                   | Easy       |
| `single-trace-group`   | 🔴 [TBA](https://blog.autorouting.com)                                    | Route a single trace through multiple points                                                 | Easy       |
| `layers-traces`        | 🔴 [TBA](https://blog.autorouting.com)                                    | Route a trace through multiple layers to connect two points                                  | Easy       |
| `traces-groups`        | 🔴 [TBA](https://blog.autorouting.com)                                    | Route multiple traces to groups of points, without crossing traces                           | Medium     |
| `layers-traces`        | 🔴 [TBA](https://blog.autorouting.com)                                    | Route multiple traces to pairs of points, without crossing traces across layers              | Hard       |
| `layers-traces-groups` | 🔴 [TBA](https://blog.autorouting.com)                                    | Route multiple traces, through multiple places, to groups of points, without crossing traces | Hard       |
| `width-constraints-*`  | 🔴 [TBA](https://blog.autorouting.com)                                    | Maintain the optimal trace widths, given target ranges for each trace                        | Hard       |
| `hyperdense-*`         | 🔴 [TBA](https://blog.autorouting.com)                                    | Super dense BGA routing                                                                      | Hard+      |
| `incremental-*`        | 🔴 [TBA](https://blog.autorouting.com)                                    | The same dataset but a component is moved or a trace is changed. Tests cache efficiency      | Hard+      |

### Example Problems

#### `simple-multi-point-trace`

![image](https://github.com/user-attachments/assets/6f21ae45-191a-4f3a-aeb2-8b56576a1ece)

## Benchmarks

There are several criteria we use for running benchmarks:

- Speed (machine specs TBD)
- Percent of Boards fully routed inside category
- Quality (as compared to "ideal routing")
  - How much longer are the traces? Shorter traces are usually better
  - How good is the trace width relative to the ideal routing
- Problem Type
- Incremental Speed (speed if a single component is moved or a trace is changed)
- Memory Usage

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
    type: "rect" | "oval" // NOTE: most datasets do not contain ovals
    center: { x: number; y: number }
    width: number
    height: number
  }>
  connections: Array<{
    name: string
    pointsToConnect: Array<{ x: number; y: number }>
  }>
  bounds: { minX: number; maxX: number; minY: number; maxY: number }
}
```

Each directory in the `datasets` directory contains a dataset for each problem. The `code` directory contains the code to generate datasets.

## Writing a Solver

You can write a solver in any language you want, but currently most of the examples are in Typescript.

> Hate Javascript? Skip to [building a non-typescript solver](#non-typescript-solvers)

> [!NOTE]
> There are tons of examples of solvers inside the [algos directory!](./algos/)

### Typescript Solvers

Typescript solvers can accept either [tscircuit soup](https://docs.tscircuit.com/api-reference/advanced/soup) or [`SimpleRouteJson`](#usage). To develop
your Typescript solver, just create a file like this:

```tsx
import { startAutoroutingDevServer, getSimpleRouteJson } from "autorouting-dataset"

const mySolver = (soup: AnySoupElement[]) => {
  const routeJson = getSimpleRouteJson(soup)

  // ...

  // ...return one or more pcb_trace objects with our solution!
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
  port: 3080
})
```

You can then run this file with `bun --hot ./solver-server.ts`

> [!TIP]
> Try it out with `bun ./algos/tscircuit-builtin/server.ts`

> [!NOTE]
> We recommend putting the solver in a separate file then importing it inside your server file, this way
> you can easily export your solver as a library!

### Non-Typescript Solvers

> [!TIP]
> Check out a [simple python autorouter](./algos/python-simple-grid-based)

- Host a server with your algorithm (see the simple flask server below)
- Run `npx autorouting-dataset server start --solver-url http://localhost:1234` (replace `localhost:1234` with your solver server url
- To benchmark your solver, run `npx autorouting-dataset benchmark --solver-url http://localhost:1234` [see running benchmarks without typescript](#running-benchmarks-without-typescript)

```python
from flask import Flask, request, jsonify
from autoroute import autoroute

app = Flask(__name__)

@app.route('/solve', methods=['POST'])
def solve():
    simple_route_json = request.json['simple_route_json']

    solution = autoroute(simple_route_json)

    return jsonify({
        "solution_soup": solution
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=1234)
```

The autorouting-dataset dev server will send a `POST` request to the provided
url with the a JSON payload containing the following fields:

```ts
interface Payload {
  problem_soup: Array<AnySoupElement>
  simple_route_json: SimpleRouteJson
}
```

You must return a JSON array containing `pcb_trace` elements in the following
format:

```ts
interface Response {
  solution_soup: Array<{
    type: "pcb_trace"
    route: Array<{
      route_type: "wire" | "via"
      x: number
      y: number
      width: number
      layer: string
    }>
  }>
}
```

## Visualizing Problems/Solutions

You can visualization your algorithm against a sample using the dev server. To
start the dev server, just run `npx autorouting-dataset server start --solver-url <solver-url>`
and run your solver server.

### Running a Dev Server with Typescript

If you're using Typescript, you can run a dev server
with the code below:

```ts
import { startDevServer } from "autorouting-dataset"
import { autoroute } from "./my-autorouter"

await startDevServer({
  solver: autoroute,
  solverName: "my-autorouter",
  port: 3080,
})
```

> [!TIP]
> Check out [this directory](./algos/simple-grid-based/) for a typical Typescript autorouter configuration

## Running a Benchmark

### Running Benchmarks with Typescript

If you have a Typescript solver, you can run a benchmark programmatically using:

```tsx
import { runBenchmark } from "autorouting-dataset"
import mySolver from "./my-solver"

const result = await runBenchmark({
  solver: mySolver,
  verbose: true,
})
```

You can then just run your file with `bun ./benchmark.ts`

> [!TIP]
> Try it out with `bun ./algos/tscircuit-builtin/benchmark.ts`

### Running Benchmarks without Typescript

```bash
autorouting-dataset benchmark --solver-url http://localhost:1234
```

See the section on [customizing benchmarks](#customizing-benchmarks) for more details
on how to change the sample count, customize the problem type etc.

## CLI Usage

You can use the CLI to generate datasets, run benchmarks, and start a dev server.

### Installation

```bash
npm install -g autorouting-dataset
```

### Starting Dev Servers

```bash
# Start the dev server with the default grid-based solver
autorouting-dataset server start

# Start the dev server with a custom solver url
autorouting-dataset server start --solver-url http://localhost:1234
```

### Running Benchmarks

Runs a benchmark against a solver server. See [running benchmarks without typescript](#running-benchmarks-without-typescript) for more details.

```bash
autorouting-dataset benchmark --solver-url http://localhost:1234
```

#### Customizing Benchmarks

| Option        | Flag             | Description                                       |
| ------------- | ---------------- | ------------------------------------------------- |
| `sampleCount` | `--sample-count` | Number of samples to run for each problem type    |
| `problemType` | `--problem-type` | Problem type to run benchmarks for (default: all) |
| `verbose`     | `--verbose`      | Prints out more information                       |
| `solverUrl`   | `--solver-url`   | URL of the solver to benchmark                    |
| `sampleSeed`  | `--sample-seed`  | Seed to randomize sampling (default: 0)           |
| `noSkipping`  | `--no-skipping`  | Disables skipping of problem types                |

By default, running a benchmark will run for 100 samples against all problem types.

> If no `problemType` is provided and the solver fails on the first 10 samples, it will
> not run the remaining samples of the problem type. You can disable this behavior
> by setting `noSkipping` to `true`

The sample count can be changed with the `--sample-count` flag. For public evaluations
the sample count should be set to at least 1,000.

### Generating Datasets

```bash
autorouting-dataset generate-dataset --problem-type single-trace --seed 0 --output ./single-trace-problem-0.json
```

## Community Solvers

Coming soon! Please create an issue to add your solver to this repo, we will be listing benchmarks etc.!

We are working on a dedicated test machine for measuring performance.

```

```
