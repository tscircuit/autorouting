#!/usr/bin/env bun
import { autoroute } from "algos/simple-grid-based"
import { startDevServer } from "autorouting-dataset"
import { AVAILABLE_DATASETS } from "../module/lib/server/available-datasets"
import Path from "node:path"
import fs from "node:fs/promises"

// 1. Run the server
const devServer = await startDevServer({
  solver: autoroute,
  solverName: "simple-grid-based",
  solverLink:
    "https://github.com/tscircuit/autorouting-dataset/blob/main/algos/simple-grid-based/index.ts",
  port: 3081,
})

const outputDir = "./static-server"

await fs.mkdir(outputDir, { recursive: true })

const downloadAndSave = async (path: string) => {
  const url = `http://localhost:3081${path}`
  const filepath = Path.join(outputDir, path)
  console.log(`Downloading ${url} to ${filepath}`)
  const content = await fetch(url).then((res) => res.text())
  await fs.writeFile(filepath, content)
}

// Download all the relevant urls
const sampleCount = 5

await downloadAndSave(`/available-datasets.json`)
await downloadAndSave(`/index.html`)
for (const problemType of AVAILABLE_DATASETS) {
  for (let i = 0; i < sampleCount; i++) {
    await fs.mkdir(Path.join(outputDir, "problem", problemType), {
      recursive: true,
    })
    await downloadAndSave(`/problem/${problemType}/${i + 1}.html`)
    await downloadAndSave(`/problem/${problemType}/${i + 1}.json`)
    await downloadAndSave(`/problem/${problemType}/${i + 1}.solution.json`)
  }
}

// Clean up
devServer.close()
