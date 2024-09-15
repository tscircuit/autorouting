import type { SolutionWithDebugInfo } from "autorouting-dataset/lib/solver-utils/ProblemSolver"
import { runBenchmark } from "../module/lib/benchmark/run-benchmark"
import { builtinSolvers } from "../module/lib/server/get-builtin-available-solver"
import fs from "fs"
import path from "path"

async function runAllBenchmarks() {
  const results: Record<string, any> = {}

  for (const [solverName, solverPromise] of Object.entries(builtinSolvers)) {
    console.log(`Running benchmark for ${solverName}...`)
    const solver = await (
      solverPromise as () => Promise<() => SolutionWithDebugInfo>
    )()
    const benchmarkResult = await runBenchmark({
      solver,
      solverName,
      verbose: true,
      sampleCount: 100,
      problemType: "all",
    })
    results[solverName] = benchmarkResult
  }

  // Update BENCHMARKS.md
  let benchmarkContent = "# Algorithm Benchmarks\n\n"
  benchmarkContent += `Last updated: ${new Date().toUTCString()}\n\n`

  for (const [solverName, result] of Object.entries(results)) {
    benchmarkContent += `## ${solverName}\n\n`
    benchmarkContent +=
      "| Problem Type | Samples Run | Completion | Average Time |\n"
    benchmarkContent +=
      "|--------------|-------------|------------|--------------|\n"
    for (const problemResult of result) {
      benchmarkContent += `| ${problemResult.problemType} | ${problemResult.samplesRun} | ${((problemResult.successfulSamples / problemResult.samplesRun) * 100).toFixed(2)}% | ${problemResult.averageTime.toFixed(2)}ms |\n`
    }
    benchmarkContent += "\n"
  }

  fs.writeFileSync(path.join(process.cwd(), "BENCHMARKS.md"), benchmarkContent)
  console.log("Benchmark results written to BENCHMARKS.md")
}

runAllBenchmarks().catch(console.error)
