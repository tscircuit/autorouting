import type { AnyCircuitElement as AnySoupElement } from "circuit-json"
import type { ProblemGenerator } from "../types"

export const hasOverlappingPads = (soup: AnySoupElement[]) => {
  const pads = soup.filter((element) => element.type === "pcb_smtpad")
  for (const pad of pads) {
    for (const otherPad of pads) {
      if (pad.pcb_smtpad_id === otherPad.pcb_smtpad_id) continue
      if (pad.shape !== "rect") continue
      if (otherPad.shape !== "rect") continue
      // Check if pads are overlapping using {x,y,width,height}
      if (
        pad.x + pad.width >= otherPad.x &&
        pad.x <= otherPad.x + otherPad.width &&
        pad.y + pad.height >= otherPad.y &&
        pad.y <= otherPad.y + otherPad.height
      ) {
        return true
      }
    }
  }
  return false
}

export const withCheckRegenerate = (
  generateProblem: ProblemGenerator["getExample"],
): ProblemGenerator["getExample"] => {
  return async (params: Parameters<ProblemGenerator["getExample"]>[0]) => {
    let soup = await generateProblem(params)

    let seedTweak = 0
    while (hasOverlappingPads(soup)) {
      seedTweak += 99999
      soup = await generateProblem({ ...params, seed: params.seed + seedTweak })
    }

    return soup
  }
}
