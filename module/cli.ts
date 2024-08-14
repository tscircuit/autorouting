import { Command } from "commander"
import { getDatasetGenerator } from "./lib/generators"
import { getSimpleRouteJson } from "./lib/solver-utils/getSimpleRouteJson"
import fs from "node:fs/promises"
import path from "node:path"
import { startDevServer } from "./lib/server/start-dev-server"
import { autoroute } from "../algos/simple-grid"
import { runBenchmark } from "./lib/benchmark/run-benchmark"
import { createSolverFromUrl } from "./lib/solver-utils/createSolverFromUrl"

const program = new Command()

program
  .name("autorouting-dataset")
  .description("CLI for autorouting-dataset module")
  .version("1.0.0")

program
  .command("server")
  .description("Start the dev server")
  .option("--solver-url <url>", "URL of the solver to use")
  .option("--solver-name <name>", "Name of the solver to use")
  .option("--port <number>", "Port to run the server on", parseInt)
  .action((options) => {
    console.log("Starting dev server...")
    startDevServer({
      solver: options.solverUrl ? undefined : autoroute,
      solverName:
        options.solveName ?? (options.solverUrl ? undefined : "simple-grid"),
      solverUrl: options.solverUrl,
      port: options.port || 3080,
    })
  })

program
  .command("generate-problem")
  .description("Generate a single problem JSON")
  .requiredOption("--problem-type <type>", "Type of problem to generate")
  .requiredOption(
    "--seed <number>",
    "Seed for random generation",
    Number.parseInt,
  )
  .requiredOption("--output <path>", "Output file path")
  .action(async (options) => {
    const generator = getDatasetGenerator(options.problemType)

    const soup = await generator.getExample({ seed: options.seed })

    await fs.writeFile(options.output, JSON.stringify(soup, null, 2))
    console.log(`Problem generated and saved to ${options.output}`)
  })

program
  .command("generate-dataset")
  .description("Generate a full dataset")
  .requiredOption("--problem-type <type>", "Type of problem to generate")
  .requiredOption(
    "--output <pattern>",
    "Output file pattern (e.g., ./problem-XXX.json)",
  )
  .option(
    "--sample-count <number>",
    "Number of samples to generate",
    parseInt,
    100,
  )
  .action(async (options) => {
    const generator = getDatasetGenerator(options.problemType)

    for (let i = 0; i < options.sampleCount; i++) {
      const soup = await generator.getExample({ seed: i })

      const outputPath = options.output.replace(
        "XXX",
        i.toString().padStart(3, "0"),
      )
      await fs.writeFile(outputPath, JSON.stringify(soup, null, 2))
      console.log(
        `Problem ${i + 1}/${options.sampleCount} generated and saved to ${outputPath}`,
      )
    }
  })

program
  .command("benchmark")
  .description("Run benchmarks against a solver")
  .requiredOption("--solver-url <url>", "URL of the solver to benchmark")
  .option(
    "--sample-count <number>",
    "Number of samples to run for each problem type",
    parseInt,
    100,
  )
  .option(
    "--problem-type <type>",
    "Problem type to run benchmarks for (default: all)",
  )
  .option("--verbose", "Prints out more information")
  .option("--sample-seed <number>", "Seed to randomize sampling", parseInt, 0)
  .option("--no-skipping", "Disables skipping of problem types")
  .action(async (options) => {
    const solver = await createSolverFromUrl(options.solverUrl)
    const results = await runBenchmark({
      solver,
      solverName: options.solverUrl,
      verbose: options.verbose,
      sampleCount: options.sampleCount,
      problemType: options.problemType,
      sampleSeed: options.sampleSeed,
      noSkipping: options.noSkipping,
    })

    console.log("Benchmark Results:")
    console.table(
      results.map((result) => ({
        "Problem Type": result.problemType,
        "Samples Run": result.samplesRun,
        "Successful Samples": result.successfulSamples,
        "Failed Samples": result.failedSamples,
        "Average Time (ms)": result.averageTime.toFixed(2),
        "Completion Rate": `${((result.successfulSamples / result.samplesRun) * 100).toFixed(2)}%`,
      })),
    )
  })

program.parse(process.argv)
