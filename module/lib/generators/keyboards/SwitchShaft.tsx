import "@tscircuit/core"

/**
 * A switch shaft you can use to connect a pluggable Kailh socket.
 *
 * Datasheet: https://wmsc.lcsc.com/wmsc/upload/file/pdf/v2/lcsc/2211090930_Kailh-CPG151101S11-1_C5184526.pdf
 */
export const SwitchShaft = (props: {
  name: string
  pcbX?: number
  pcbY?: number
}) => (
  <chip
    {...props}
    footprint={
      <footprint>
        {/* <silkscreentext text={props.name} /> */}
        <smtpad
          shape="rect"
          width="2.55mm"
          height="2.5mm"
          portHints={["pin1"]}
          layer="top"
        />
        <smtpad
          shape="rect"
          width="2.55mm"
          height="2.5mm"
          portHints={["pin2"]}
          layer="top"
        />
        <hole name="H1" diameter="3mm" />
        <hole name="H2" diameter="3mm" />
        <constraint xDist="6.35mm" centerToCenter left=".H1" right=".H2" />
        <constraint yDist="2.54mm" centerToCenter top=".H1" bottom=".H2" />
        <constraint edgeToEdge xDist="11.3mm" left=".pin1" right=".pin2" />
        <constraint sameY for={[".pin1", ".H1"]} />
        <constraint sameY for={[".pin2", ".H2"]} />
        <constraint
          edgeToEdge
          xDist={(11.3 - 6.35 - 3) / 2}
          left=".pin1"
          right=".H1"
        />
      </footprint>
    }
  />
)
