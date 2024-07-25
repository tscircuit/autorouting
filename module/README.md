# autorouting-dataset module

This module contains code to generate datasets for the autorouting-dataset, as
well as utilities released as an npm package for generating datasets, working
with the dataset data, creating solvers, running benchmarks, and visualizing
problems and solutions.

This project is developed using `bun` but builds using `tsup` into node-compatible
javascript.

> [!NOTE]
> Looking to create an autorouting solver? Check out [this README instead](../README.md#writing-a-solver)

- [autorouting-dataset module](#autorouting-dataset-module)
  - [CLI Usage](#cli-usage)
    - [Start Dev Server](#start-dev-server)
    - [Generating Datasets](#generating-datasets)
  - [Programmatic Usage](#programmatic-usage)
    - [`generateDataset`](#generatedataset)
    - [`getSimpleRouteJson`](#getsimpleroutejson)
  - [Development](#development)

## CLI Usage

### Start Dev Server

The dev server can be used to visualize problems, solutions and benchmarking
results while you develop your solver. You can start the dev server with:

```bash
autorouting-dataset server start
```

### Generating Datasets

```bash
# Generate a single soup json for the single-trace problem
autorouting-dataset generate-problem --problem-type single-trace --seed 0 --output ./single-trace-problem-0.json

# Generate a full dataset
autorouting-dataset generate-dataset --problem-type single-trace --output ./single-trace-problem-XXX.json
```

## Programmatic Usage

### `generateDataset`

```tsx
import { getDatasetGenerator } from "autorouting-dataset"

const generator = getDatasetGenerator({
  problem: "single-trace",
})

// Get a single dataset example
const soup = await generator.getExample({ seed: 0 })
```

### `getSimpleRouteJson`

You can use this method to get a simple json representation of a routing problem.

```tsx
import { getSimpleRouteJson } from "autorouting-dataset"

const routeJson = getSimpleRouteJson(soup)
```

## Development

Run `bun run start` to start the dev server. Then go to `http://localhost:3000` to view the dev server.

This project uses a statically compiled frontend via vite. The server injects
data into the frontend by placing a script tag in the html file that sets variables
like `window.PROBLEM_SOUP`. Soup always refers to the [tscircuit json soup format](https://docs.tscircuit.com/api-reference/advanced/soup).

When loading a page, the dev server uses the url to generate the problem soup,
e.g. if the url is `/problem/single-trace/1` the dev server will generate a
problem soup using `getDatasetGenerator("single-trace").getExample({ seed: 1 })`
and set the `window.PROBLEM_SOUP` variable to the generated soup.

If a `solver` is given to the dev server, it will run the solver and place the
result inside the `window.SOLUTION_SOUP` variable.

If a `solverUrl` is given to the dev server, it will make a request to the url
with `{ problem_soup, simple_route_json }` and use the response `{ solution_soup }`
to set the `window.SOLUTION_SOUP` variable.

Note that the `solver` or `solverUrl` may return a soup with only `pcb_trace` elements,
the rest of the elements (e.g. `pcb_component`) will be automatically added by the dev server.
