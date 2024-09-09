import { getRandomFootprint } from "../../generator-utils/getRandomFootprint"
import { rand } from "../../generator-utils/rand"

export type SingleTrace2FootprintsProps = {
  seed: number
  distance?: number
}

const seed1Footprint = {
  footprint: "0402",
  pinCount: 2,
  footprintType: "passive",
}

export const SingleTrace2Footprints = ({
  seed,
  distance = 10,
}: SingleTrace2FootprintsProps) => {
  const rotation = rand(seed, "rotation").range(0, Math.PI * 2)
  const aFoot =
    seed === 1 ? seed1Footprint : getRandomFootprint([seed, "AFootprint"])
  const bFoot =
    seed === 1 ? seed1Footprint : getRandomFootprint([seed, "BFootprint"])
  const A = () => {
    return <bug name="A" footprint={aFoot.footprint} pcbX={0} pcbY={0} />
  }
  const B = () => {
    const pcbX = Math.cos(rotation) * distance
    const pcbY = Math.sin(rotation) * distance
    return (
      <bug
        name="B"
        footprint={bFoot.footprint}
        pcbX={pcbX}
        pcbY={pcbY}
        layer="bottom"
      />
    )
  }

  return (
    <board
      width={distance * 2}
      height={distance * 2}
      pcbX={0}
      pcbY={0}
      routingDisabled
    >
      <A />
      <B />
      <trace
        from={`.A > port.${rand(seed, "aFrom").int(1, aFoot.pinCount)}`}
        to={`.B > port.${rand(seed, "bFrom").int(1, bFoot.pinCount)}`}
      />
    </board>
  )
}

export const SingleTraceMultilayerCircuit = ({
  seed,
  distance,
}: SingleTrace2FootprintsProps) => {
  // TODO randomly select a layout configuration using rand(seed).int(0, NUM_CONFIGURATIONS)
  return <SingleTrace2Footprints seed={seed} distance={distance} />
}
