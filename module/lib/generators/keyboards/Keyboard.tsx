import { Key } from "./Key"

export const Keyboard = ({
  rows,
  cols,
  keyCount,
  keyIndices,
}: { rows: number; cols: number; keyCount: number; keyIndices?: number[] }) => {
  const keySpacing = 19.05
  const keyPositions = Array.from({ length: rows * cols })
    .map((_, i) => ({
      col: i % cols,
      row: Math.floor(i / cols),
    }))
    .filter((_, i) => !keyIndices || keyIndices.includes(i))
    .slice(0, keyCount)
    .map((p, i) => ({
      ...p,
      keyNum: i + 1,
    }))
    .map((p) => ({
      ...p,
      x: p.col * keySpacing - keySpacing * (cols - 1) - keySpacing / 2,
      y: p.row * keySpacing - (keySpacing * (rows - 1)) / 2,
    }))

  const rowToMicroPin = {
    0: "pin2",
    1: "pin3",
    2: "pin4",
    3: "pin5",
    4: "pin6",
    5: "pin7",
    6: "pin8",
    7: "pin9",
    8: "pin10",
    9: "pin11",
    10: "pin12",
  }
  const colToMicroPin = {
    0: "pin13",
    1: "pin14",
    2: "pin15",
    3: "pin16",
    4: "pin17",
    5: "pin18",
    6: "pin19",
    7: "pin20",
    8: "pin21",
    9: "pin22",
    10: "pin23",
  }

  return (
    <board width="120mm" height="80mm" routingDisabled>
      {keyPositions.map(({ keyNum, x, y }) => (
        <Key name={`K${keyNum}`} keyNum={keyNum} pcbX={x} pcbY={y} />
      ))}
      <chip name="U1" pcbX={15} footprint="dip24_w0.7in_h1.3in" />
      {keyPositions.map(({ keyNum, row, col }) => (
        <trace
          // @ts-ignore
          key={`trace-${keyNum}-col`}
          from={`.SW${keyNum} .pin1`}
          to={`.U1 .${colToMicroPin[col as 0 | 1 | 2]}`}
        />
      ))}
      {keyPositions.map(({ keyNum, row, col }) => (
        <trace
          // @ts-ignore
          key={`trace-${keyNum}-row`}
          from={`.D${keyNum} .pin2`}
          to={`.U1 .${rowToMicroPin[row as 0 | 1 | 2]}`}
        />
      ))}
    </board>
  )
}
