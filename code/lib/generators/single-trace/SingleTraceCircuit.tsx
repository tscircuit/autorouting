import {  } from "tscircuit"

export const SingleTraceCircuit = ({ seed }: { seed: number }) => {
  return (
    <board width="10mm" height="10mm" center_x={0} center_y={0}>
      <resistor name="R1" footprint="0402" pcbX={0} pcbY={0} resistance="10k" />
    </board>
  )
}