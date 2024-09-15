import type { SolutionWithDebugInfo } from "autorouting-dataset/lib/solver-utils/ProblemSolver"
import {
  runBenchmark,
  type BenchmarkResult,
} from "../module/lib/benchmark/run-benchmark"
import { builtinSolvers } from "../module/lib/server/get-builtin-available-solver"
import fs from "fs"
import path from "path"

async function runAllBenchmarks() {
  const results: Record<string, BenchmarkResult[]> = {}

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

  // Collect all problem types
  const problemTypesSet = new Set<string>()
  for (const result of Object.values(results)) {
    for (const problemResult of result) {
      problemTypesSet.add(problemResult.problemType)
    }
  }
  const problemTypes = Array.from(problemTypesSet)

  function abbreviateProblemType(problemType: string): string {
    return problemType.slice(0, 3).toLowerCase()
  }

  type SolverData = {
    solverName: string
    averageCorrectness: number
    averageTimePerSample: number
    problemData: Record<
      string,
      {
        accuracy: number
        averageTime: number
      }
    >
  }

  const solverDataArray: SolverData[] = []

  for (const [solverName, result] of Object.entries(results)) {
    const problemData: Record<
      string,
      { accuracy: number; averageTime: number }
    > = {}
    let totalSuccessfulSamples = 0
    let totalSamplesRun = 0
    let totalTime = 0
    let totalSamplesForTime = 0 // total samples used in time calculation
    for (const problemResult of result) {
      const samplesRun = problemResult.samplesRun
      const successfulSamples = problemResult.successfulSamples
      const accuracy = successfulSamples / samplesRun
      const averageTime = problemResult.averageTime // per sample

      problemData[problemResult.problemType] = {
        accuracy,
        averageTime,
      }

      totalSuccessfulSamples += successfulSamples
      totalSamplesRun += samplesRun
      totalTime += averageTime * samplesRun
      totalSamplesForTime += samplesRun
    }
    const averageCorrectness = totalSuccessfulSamples / totalSamplesRun
    const averageTimePerSample = totalTime / totalSamplesForTime

    solverDataArray.push({
      solverName,
      averageCorrectness,
      averageTimePerSample,
      problemData,
    })
  }

  // Sort solvers by average correctness
  solverDataArray.sort((a, b) => b.averageCorrectness - a.averageCorrectness)

  // Update BENCHMARKS.md
  let benchmarkContent = "# Algorithm Benchmarks\n\n"
  benchmarkContent += `Last updated: ${new Date().toUTCString()}\n\n`

  // Generate table header
  let tableHeaderColumns = ["Solver", "Ranking"]
  let tableSeparatorColumns = ["------", "-------"]

  tableHeaderColumns.push("Avg Correctness", "Avg Time/Sample")
  tableSeparatorColumns.push("---------------", "----------------")

  let tableHeader = "| " + tableHeaderColumns.join(" | ") + " |\n"
  let tableSeparator = "| " + tableSeparatorColumns.join(" | ") + " |\n"

  benchmarkContent += tableHeader
  benchmarkContent += tableSeparator

  // Now, write table rows
  let rank = 1
  for (const solverData of solverDataArray) {
    let rowColumns = [solverData.solverName, rank.toString()]
    const avgCorrectness =
      (solverData.averageCorrectness * 100).toFixed(2) + "%"
    const avgTimePerSample = solverData.averageTimePerSample.toFixed(2) + "ms"
    rowColumns.push(avgCorrectness, avgTimePerSample)

    let row = "| " + rowColumns.join(" | ") + " |\n"
    benchmarkContent += row
    rank++
  }

  benchmarkContent += "\n"

  // Append detailed results per solver
  for (const [solverName, result] of Object.entries(results)) {
    benchmarkContent += `## ${solverName}\n\n`
    benchmarkContent +=
      "| Problem Type | Samples Run | Completion | Average Time |\n"
    benchmarkContent +=
      "|--------------|-------------|------------|--------------|\n"
    for (const problemResult of result) {
      benchmarkContent += `| ${problemResult.problemType} | ${problemResult.samplesRun} | ${(
        (problemResult.successfulSamples / problemResult.samplesRun) *
        100
      ).toFixed(2)}% | ${problemResult.averageTime.toFixed(2)}ms |\n`
    }
    benchmarkContent += "\n"
  }

  fs.writeFileSync(path.join(process.cwd(), "BENCHMARKS.md"), benchmarkContent)
  console.log("Benchmark results written to BENCHMARKS.md")
}

runAllBenchmarks().catch(console.error)
