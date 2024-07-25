import { getRandomFootprint } from "../../generator-utils/getRandomFootprint"
import { rand } from "../../generator-utils/rand"

export const Traces2Footprints = ({ seed }: { seed: number }) => {
  const rotation = rand(seed, "rotation").range(0, Math.PI * 2)
  const aFoot = getRandomFootprint([seed, "AFootprint"])
  const bFoot = getRandomFootprint([seed, "BFootprint"])
  const maxConns = Math.min(aFoot.pinCount, bFoot.pinCount)
  let traceCount: number
  if (seed < 50) {
    traceCount = Math.min(maxConns, 2 + Math.floor(seed / 10))
  } else {
    traceCount = rand(seed, "traceCount").int(2, maxConns)
  }

  const aPinNums = rand(seed, "aPinNums").shuffle(
    Array.from({ length: aFoot.pinCount }, (_, i) => i + 1),
  )
  const bPinNums = rand(seed, "bPinNums").shuffle(
    Array.from({ length: bFoot.pinCount }, (_, i) => i + 1),
  )

  const pinPairs = Array.from({ length: traceCount }, (_, i) => {
    const a = aPinNums[i]
    const b = bPinNums[i]
    return [a, b]
  })

  const A = () => {
    return <bug name="A" footprint={aFoot.footprint} pcbX={0} pcbY={0} />
  }
  const B = () => {
    const pcbX = Math.cos(rotation) * 10
    const pcbY = Math.sin(rotation) * 10
    return <bug name="B" footprint={bFoot.footprint} pcbX={pcbX} pcbY={pcbY} />
  }

  return (
    <board width="20mm" height="20mm" center_x={0} center_y={0}>
      <A />
      <B />
      {pinPairs.map(([a, b]) => (
        <trace
          // @ts-ignore
          key={`${a}-${b}`}
          from={`.A > port.${a}`}
          to={`.B > port.${b}`}
        />
      ))}
    </board>
  )
}

export const TracesCircuit = ({ seed }: { seed: number }) => {
  // TODO randomly select a layout configuration using rand(seed).int(0, NUM_CONFIGURATIONS)
  return <Traces2Footprints seed={seed} />
}
