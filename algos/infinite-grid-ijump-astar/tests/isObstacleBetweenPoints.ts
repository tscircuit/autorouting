import { ObstacleList } from "../v2/lib/ObstacleList"
import type { PointWithLayer as Point } from "solver-utils"

export const isObstacleBetweenPoints = (
  A: Point,
  B: Point,
  obstacleList: ObstacleList,
) => {
  const collision = obstacleList.getOrthoDirectionCollisionInfo(
    A,
    {
      dx: Math.sign(B.x - A.x),
      dy: Math.sign(B.y - A.y),
    },
    {
      margin: 0.05,
    },
  )
  const dist = Math.sqrt((A.x - B.x) ** 2 + (A.y - B.y) ** 2)
  return collision.wallDistance < dist
}
