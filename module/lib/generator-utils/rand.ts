import MersenneTwister from "mersenne-twister"

const hashCode = function (s: string) {
  let hash = 0,
    i,
    chr
  if (s.length === 0) return hash
  for (i = 0; i < s.length; i++) {
    chr = s.charCodeAt(i)
    hash = (hash << 5) - hash + chr
    hash |= 0 // Convert to 32bit integer
  }
  return hash
}

const generator = new MersenneTwister(1)

/**
 * Generates a random number between 0 and 1 using the provided seeds.
 */
export const rand = (...seeds: (string | number)[]) => {
  generator.init_by_array(
    seeds.map((seed) =>
      typeof seed === "string" ? hashCode(seed.toString()) : seed
    ),
    seeds.length
  )

  return {
    int: (min: number, max: number) =>
      Math.floor(generator.random() * (max + 1 - min) + min),
    float: () => generator.random(),
    range: (min: number, max: number) => generator.random() * (max - min) + min,
    select: <T>(options: Array<T>): T =>
      options[Math.floor(generator.random() * options.length)],
    bool: () => generator.random() < 0.5,
    shuffle: <T>(arr: Array<T>) => {
      const shuffled = [...arr]
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(generator.random() * (i + 1))
        ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
      }
      return shuffled
    },
  }
}
