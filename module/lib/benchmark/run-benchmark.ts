import type { ProblemSolver } from "../solver-utils/ProblemSolver"
import { getDatasetGenerator } from "../generators"
import type { AnySoupElement } from "@tscircuit/soup"
import type { ProblemType } from "../generators/types"
import { isValidSolution } from "./is-valid-solution"
import kleur from "kleur"
import { last } from "lodash"
import { normalizeSolution } from "../solver-utils/normalize-solution"
import fs from "fs"

interface BenchmarkOptions {
  solver: ProblemSolver
  solverName?: string
  verbose?: boolean
  sampleCount?: number
  problemType?: ProblemType | "all"
  sampleSeed?: number
  noSkipping?: boolean
  outputFile?: string
}

interface BenchmarkResult {
  problemType: ProblemType | "all"
  samplesRun: number
  successfulSamples: number
  averageTime: number
  failedSamples: number
}

const fromEnv = <T extends string | number | undefined>(
  key: string,
  defaultValue?: T,
): T => {
  const value = process.env[key]
  if (!value) {
    if (defaultValue !== undefined) return defaultValue
    throw new Error(`Environment variable ${key} is not set`)
  }
  if (typeof defaultValue === "number") {
    return parseInt(value) as T
  }
  return value as T
}

export async function runBenchmark(
  options: BenchmarkOptions,
): Promise<BenchmarkResult[]> {
  const {
    solver,
    solverName,
    verbose = false,
    sampleCount = fromEnv("SAMPLE_COUNT", 100),
    problemType = fromEnv("PROBLEM_TYPE", "all"),
    sampleSeed = fromEnv("SAMPLE_SEED", 0),
    noSkipping = false,
    outputFile = fromEnv("OUTPUT_FILE", ""),
  } = options

  const problemTypes: ProblemType[] =
    problemType && problemType !== "all"
      ? [problemType]
      : ["single-trace", "traces", "distant-single-trace", "keyboards"] // Add more problem types as they become available

  const results: BenchmarkResult[] = []

  for (const problemType of problemTypes) {
    if (verbose)
      console.log(
        kleur.yellow(
          `\n================================================================================\nRunning benchmark for problem type: "${problemType}"\n================================================================================\n`,
        ),
      )

    const generator = getDatasetGenerator(problemType)
    let samplesRun = 0
    let successfulSamples = 0
    let totalTime = 0
    let failedSamples = 0

    let lastTenResults: boolean[] = []
    console.log("".padEnd(30, " ") + kleur.gray(" 0 1 2 3 4 5 6 7 8 9"))
    for (let i = 0; i < sampleCount; i++) {
      const seed = sampleSeed + i
      const soup = await generator.getExample({ seed })

      try {
        const startTime = performance.now()
        const { solution } = await normalizeSolution(solver(soup))
        const endTime = performance.now()
        const sampleCorrect = isValidSolution(soup, solution)

        if (sampleCorrect) {
          successfulSamples++
          totalTime += endTime - startTime
        } else {
          failedSamples++
        }

        samplesRun++

        lastTenResults.push(sampleCorrect)
        if (verbose && (i + 1) % 10 === 0) {
          console.log(
            // use emojis for success/failure (emoji check and cross)
            kleur.gray(
              `${`${problemType}[${`${i + 1 - 10}-${i}`}]:`.padEnd(30, " ")} ${lastTenResults
                .map((res) => (res ? kleur.green("✅") : kleur.red("❌")))
                .join("")}`,
            ),
          )
          lastTenResults = []
        }
      } catch (error) {
        failedSamples++
        samplesRun++
        if (verbose) console.error(`Error in sample ${i + 1}:`, error)
      }

      if (!noSkipping && failedSamples >= 10 && samplesRun < 10) {
        if (verbose)
          console.log(
            `Skipping remaining samples for ${problemType} due to high failure rate`,
          )
        break
      }
    }

    const result: BenchmarkResult = {
      problemType: problemType,
      samplesRun,
      successfulSamples,
      averageTime: successfulSamples > 0 ? totalTime / successfulSamples : 0,
      failedSamples,
    }

    results.push(result)

    if (verbose) {
      console.log(`\nBenchmark results for ${problemType}:`)
      console.log(`  Samples run: ${samplesRun}`)
      console.log(`  Successful samples: ${successfulSamples}`)
      console.log(`  Failed samples: ${failedSamples}`)
      console.log(`  Average time: ${result.averageTime.toFixed(2)}ms`)
      console.log("")
    }
  }

  if (verbose) {
    console.log(`${solverName} benchmark results:`)
    console.table(
      results.map((result) => ({
        "Problem Type": result.problemType,
        "Samples Run": result.samplesRun,
        Completion: `${((result.successfulSamples / result.samplesRun) * 100).toFixed(2)}%`,
        "Average Time": `${result.averageTime.toFixed(2)}ms`,
      })),
    )
  }

  if (outputFile) {
    fs.writeFileSync(outputFile, JSON.stringify(results, null, 2))
  }

  return results
}
