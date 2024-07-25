import { ProblemSolver } from "../solver-utils/ProblemSolver"
import { getDatasetGenerator } from "../generators"
import { AnySoupElement } from "@tscircuit/soup"
import type { ProblemType } from "../generators/types"
import { isValidSolution } from "./is-valid-solution"

interface BenchmarkOptions {
  solver: ProblemSolver
  verbose?: boolean
  sampleCount?: number
  problemType?: ProblemType | "all"
  sampleSeed?: number
  noSkipping?: boolean
}

interface BenchmarkResult {
  problemType: ProblemType | "all"
  samplesRun: number
  successfulSamples: number
  averageTime: number
  failedSamples: number
}

export async function runBenchmark(
  options: BenchmarkOptions,
): Promise<BenchmarkResult[]> {
  const {
    solver,
    verbose = false,
    sampleCount = 100,
    problemType,
    sampleSeed = 0,
    noSkipping = false,
  } = options

  const problemTypes: ProblemType[] =
    problemType && problemType !== "all"
      ? [problemType]
      : ["single-trace", "traces"] // Add more problem types as they become available

  const results: BenchmarkResult[] = []

  for (const type of problemTypes) {
    if (verbose) console.log(`Running benchmark for problem type: ${type}`)

    const generator = getDatasetGenerator(type)
    let samplesRun = 0
    let successfulSamples = 0
    let totalTime = 0
    let failedSamples = 0

    for (let i = 0; i < sampleCount; i++) {
      const seed = sampleSeed + i
      const soup = await generator.getExample({ seed })

      try {
        const startTime = performance.now()
        const solution = await solver(soup)
        const endTime = performance.now()

        if (isValidSolution(soup, solution)) {
          successfulSamples++
          totalTime += endTime - startTime
        } else {
          failedSamples++
        }

        samplesRun++

        if (verbose) {
          console.log(
            `Sample ${i + 1}: ${isValidSolution(soup, solution) ? "Success" : "Failed"}`,
          )
        }
      } catch (error) {
        failedSamples++
        samplesRun++
        if (verbose) console.error(`Error in sample ${i + 1}:`, error)
      }

      if (!noSkipping && failedSamples >= 10 && samplesRun < sampleCount) {
        if (verbose)
          console.log(
            `Skipping remaining samples for ${type} due to high failure rate`,
          )
        break
      }
    }

    const result: BenchmarkResult = {
      problemType: type,
      samplesRun,
      successfulSamples,
      averageTime: successfulSamples > 0 ? totalTime / successfulSamples : 0,
      failedSamples,
    }

    results.push(result)

    if (verbose) {
      console.log(`Benchmark results for ${type}:`)
      console.log(`  Samples run: ${samplesRun}`)
      console.log(`  Successful samples: ${successfulSamples}`)
      console.log(`  Failed samples: ${failedSamples}`)
      console.log(`  Average time: ${result.averageTime.toFixed(2)}ms`)
    }
  }

  return results
}
