import { getRandomFootprint } from "../../generator-utils/getRandomFootprint"
import { rand } from "../../generator-utils/rand"

export type SingleTrace2FootprintsProps = {
  seed: number
  distance?: number
}

export const SingleTrace2Footprints = ({
  seed,
  distance = 10,
}: SingleTrace2FootprintsProps) => {
  const rotation = rand(seed, "rotation").range(0, Math.PI * 2)
  const aFoot = getRandomFootprint([seed, "AFootprint"])
  const bFoot = getRandomFootprint([seed, "BFootprint"])
  const A = () => {
    return <bug name="A" footprint={aFoot.footprint} pcbX={0} pcbY={0} />
  }
  const B = () => {
    const pcbX = Math.cos(rotation) * distance
    const pcbY = Math.sin(rotation) * distance
    return <bug name="B" footprint={bFoot.footprint} pcbX={pcbX} pcbY={pcbY} />
  }

  return (
    <board width="20mm" height="20mm" pcbX={0} pcbY={0}>
      <A />
      <B />
      <trace
        from={`.A > port.${rand(seed, "aFrom").int(1, aFoot.pinCount)}`}
        to={`.B > port.${rand(seed, "bFrom").int(1, bFoot.pinCount)}`}
      />
    </board>
  )
}

export const SingleTraceCircuit = ({
  seed,
  distance,
}: SingleTrace2FootprintsProps) => {
  // TODO randomly select a layout configuration using rand(seed).int(0, NUM_CONFIGURATIONS)
  return <SingleTrace2Footprints seed={seed} distance={distance} />
}
