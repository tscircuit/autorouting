import type {
  Obstacle,
  SimplifiedPcbTrace,
} from "autorouting-dataset/lib/types"

export const getObstaclesFromTrace = (
  trace: SimplifiedPcbTrace,
  source_trace_id: string,
): Obstacle[] => {
  const obstacles: Obstacle[] = []
  for (let i = 0; i < trace.route.length - 1; i++) {
    const [start, end] = [trace.route[i], trace.route[i + 1]]

    const isHorz = start.y === end.y
    const isVert = start.x === end.x

    if (!isHorz && !isVert) {
      throw new Error(
        `getObstaclesFromTrace only supports horizontal and vertical traces (not diagonals) atm`,
      )
    }

    const obstacle: Obstacle = {
      type: "rect",
      layers: [start.layer],
      center: {
        x: (start.x + end.x) / 2,
        y: (start.y + end.y) / 2,
      },
      width: isHorz ? Math.abs(start.x - end.x) : 0.1, // TODO use route width
      height: isVert ? Math.abs(start.y - end.y) : 0.1, // TODO use route width
      connectedTo: [source_trace_id],
    }

    obstacles.push(obstacle)
  }
  return obstacles
}
