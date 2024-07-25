import { rand } from "./rand"

export const getRandomFootprint = (seeds: Array<number | string>) => {
  const passive = rand(...seeds, "passive").float() < 0.1

  if (passive) {
    const footprint = rand(...seeds, "footprint", 0).select([
      "0402",
      "0603",
      "0805",
      "1206",
    ])
    return { footprint, pinCount: 2, footprintType: "passive" }
  }

  const footprintType = rand(...seeds, "footprintType").select([
    "tssop",
    "soic",
    "qfn",
    "bga",
    "qfp",
  ])

  let pinCount: number
  if (footprintType === "bga") {
    pinCount = rand(...seeds, "bgaPinCount").int(2, 8) ** 2
  } else if (footprintType === "qfn") {
    const topSide = rand(...seeds, "topSide").int(4, 8)
    pinCount = 2 * topSide + 2 * (topSide - 1)
  } else {
    pinCount = 2 * rand(...seeds, "pinCount").int(2, 8)
  }

  return {
    footprintType,
    pinCount,
    footprint: `${footprintType}${pinCount}`,
  }
}
