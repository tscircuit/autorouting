import type { Obstacle, Point } from "../types"

export function computeOptimalPoints(
  obstacle: Obstacle,
  margin: number = 0,
): Point[] {
  if (obstacle.obstacleType === "line") {
    const [start, end] = obstacle.linePoints

    const dCent = obstacle.width / 2 + margin

    // Calculate the direction vector of the line
    const dx = end.x - start.x
    const dy = end.y - start.y
    const length = Math.sqrt(dx * dx + dy * dy)
    const unitDx = dx / length
    const unitDy = dy / length

    // Calculate the perpendicular vector
    const perpDx = -unitDy
    const perpDy = unitDx

    const startExt = {
      x: start.x - unitDx * margin,
      y: start.y - unitDy * margin,
    }

    const endExt = {
      x: end.x + unitDx * margin,
      y: end.y + unitDy * margin,
    }

    // Calculate the four corners
    const corners: Point[] = [
      { x: startExt.x + perpDx * dCent, y: startExt.y + perpDy * dCent },
      { x: startExt.x - perpDx * dCent, y: startExt.y - perpDy * dCent },
      { x: endExt.x - perpDx * dCent, y: endExt.y - perpDy * dCent },
      { x: endExt.x + perpDx * dCent, y: endExt.y + perpDy * dCent },
    ]

    return corners

    // Compute optimal points for each edge
    const optimalPoints: Point[] = [
      ...computeEdgePoints(corners[0], corners[1]),
      ...computeEdgePoints(corners[1], corners[2]),
      ...computeEdgePoints(corners[2], corners[3]),
      ...computeEdgePoints(corners[3], corners[0]),
    ]

    return optimalPoints
  }

  return []
}

function computeEdgePoints(start: Point, end: Point): Point[] {
  const points: Point[] = [start, end]
  const distance = Math.sqrt(
    Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2),
  )

  if (distance > 0.1) {
    const midpoint: Point = {
      x: (start.x + end.x) / 2,
      y: (start.y + end.y) / 2,
    }
    points.push(midpoint)

    // Recursively compute midpoints
    points.push(...computeEdgePoints(start, midpoint))
    points.push(...computeEdgePoints(midpoint, end))
  }

  return points
}
