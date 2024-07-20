import { getRandomFootprint } from "../../generator-utils/getRandomFootprint"
import { rand } from "../../generator-utils/rand"

export const SingleTrace2Footprints = ({ seed }: { seed: number }) => {
  const rotation = rand(seed, "rotation").range(0, Math.PI * 2)
  const aFoot = getRandomFootprint([seed, "AFootprint"])
  const bFoot = getRandomFootprint([seed, "BFootprint"])
  const A = () => {
    return <bug name="A" footprint={aFoot.footprint} pcbX={0} pcbY={0} />
  }
  const B = () => {
    const pcbX = Math.cos(rotation) * 10
    const pcbY = Math.sin(rotation) * 10
    return <bug name="B" footprint={bFoot.footprint} pcbX={pcbX} pcbY={pcbY} />
  }

  return (
    <board width="10mm" height="10mm" center_x={0} center_y={0}>
      <A />
      <B />
      <trace
        from={`.A > port.${rand(seed, "aFrom").int(0, aFoot.pinCount - 1)}`}
        to={`.B > port.${rand(seed, "bFrom").int(0, bFoot.pinCount - 1)}`}
      />
    </board>
  )
}

export const SingleTraceCircuit = ({ seed }: { seed: number }) => {
  // TODO randomly select a layout configuration using rand(seed).int(0, NUM_CONFIGURATIONS)
  return <SingleTrace2Footprints seed={seed} />
}
