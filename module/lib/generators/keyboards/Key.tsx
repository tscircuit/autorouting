import { SwitchShaft } from "./SwitchShaft"

export const Key = (props: {
  name: string
  keyNum: number
  pcbX: number
  pcbY: number
}) => {
  const shaftName = `SW${props.keyNum}`
  const diodeName = `D${props.keyNum}`
  return (
    <>
      <SwitchShaft
        key="shaft1"
        name={shaftName}
        pcbX={props.pcbX}
        pcbY={props.pcbY}
      />
      <diode
        // @ts-ignore
        key="diode"
        pcbRotation={-90}
        name={diodeName}
        footprint="0603"
        pcbX={props.pcbX + 7}
        pcbY={props.pcbY - 6}
      />
      <trace
        // @ts-ignore
        key="trace1"
        from={`.${shaftName} .pin2`}
        to={`.${diodeName} .pin1`}
      />
    </>
  )
}
