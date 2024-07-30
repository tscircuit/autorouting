#!/usr/bin/env bun
import { autoroute } from "algos/simple-grid-based"
import { startDevServer } from "autorouting-dataset"

// 1. Run the server
const devServer = await startDevServer({
  solver: autoroute,
  solverName: "simple-grid-based",
  solverLink:
    "https://github.com/tscircuit/autorouting-dataset/blob/main/algos/simple-grid-based/index.ts",
  port: 3080,
})

// Download all the relevant urls
// const

// Clean up
devServer.close()
