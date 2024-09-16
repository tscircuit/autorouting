import type { Obstacle } from "solver-utils"

export const convertObstacleToLineObstacle = (obstacle: Obstacle) => ({
  obstacleType: "line" as const,
  linePoints: [
    {
      x: obstacle.center.x,
      y: obstacle.center.y - obstacle.height / 2,
    },
    {
      x: obstacle.center.x,
      y: obstacle.center.y + obstacle.height / 2,
    },
  ],
  width: obstacle.width,
})
