import type { Obstacle } from "autorouting-dataset/lib/types"

interface Point {
  x: number
  y: number
}

export const getObstaclesFromRoute = (
  route: Point[],
  source_trace_id: string,
): Obstacle[] => {
  const obstacles: Obstacle[] = []
  for (let i = 0; i < route.length - 1; i++) {
    const [start, end] = [route[i], route[i + 1]]

    const isHorz = start.y === end.y
    const isVert = start.x === end.x

    if (!isHorz && !isVert) {
      throw new Error(
        `getObstaclesFromTrace only supports horizontal and vertical traces (not diagonals) atm`,
      )
    }

    const obstacle: Obstacle = {
      type: "rect",
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
