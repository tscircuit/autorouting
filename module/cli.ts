import { Command } from "commander"
import { getDatasetGenerator } from "./lib/generators"
import { getSimpleRouteJson } from "./lib/solver-utils/getSimpleRouteJson"
import fs from "node:fs/promises"
import path from "node:path"
import { startServer } from "./lib/server/start-server"

const program = new Command()

program
  .name("autorouting-dataset")
  .description("CLI for autorouting-dataset module")
  .version("1.0.0")

program
  .command("server")
  .description("Start the dev server")
  .action(() => {
    console.log("Starting dev server...")
    startServer()
    // Implement server start logic here
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
  .action(async (options) => {
    const generator = getDatasetGenerator(options.problemType)

    const datasetSize = 100 // TODO make this configurable
    for (let i = 0; i < datasetSize; i++) {
      const soup = await generator.getExample({ seed: i })

      const outputPath = options.output.replace(
        "XXX",
        i.toString().padStart(3, "0"),
      )
      await fs.writeFile(outputPath, JSON.stringify(soup, null, 2))
      console.log(
        `Problem ${i + 1}/${datasetSize} generated and saved to ${outputPath}`,
      )
    }
  })

program.parse(process.argv)
