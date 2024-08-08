import type { Obstacle } from "autorouting-dataset"

export function getOptimalPointsForObstacle(obstacle: Obstacle, margin: number = 0.1) {
  const { center, width, height } = obstacle
  const halfWidth = width / 2 + margin
  const halfHeight = height / 2 + margin

  return [
    { x: center.x - halfWidth, y: center.y - halfHeight },
    { x: center.x + halfWidth, y: center.y - halfHeight },
    { x: center.x - halfWidth, y: center.y + halfHeight },
    { x: center.x + halfWidth, y: center.y + halfHeight },
  ]
}
