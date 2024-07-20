# autorouting-dataset module

This module contains code to generate datasets for the autorouting-dataset, as
well as utilities released as an npm package for generating datasets, working
with the dataset data, creating solvers, running benchmarks, and visualizing
problems and solutions.

This project is developed using `bun` but builds using `tsup` into node-compatible
javascript.

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
