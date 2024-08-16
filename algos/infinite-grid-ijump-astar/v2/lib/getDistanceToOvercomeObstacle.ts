import type { Obstacle } from "autorouting-dataset"
import Debug from "debug"
import type { QuadtreeObstacleList } from "./QuadtreeObstacleList"

const debug = Debug(
  "autorouting-dataset:infinite-grid-ijump-astar:get-distance-to-overcome-obstacle",
)

export function getDistanceToOvercomeObstacle({
  node,
  dir,
  orthoDir,
  obstacle,
  obstacles,
  obstaclesInRow = 0,
  OBSTACLE_MARGIN = 0.15,
  SHOULD_DETECT_CONJOINED_OBSTACLES = false,
  MAX_CONJOINED_OBSTACLES = 20,
}: {
  node: { x: number; y: number }
  dir: { x: number; y: number; distance: number }
  orthoDir: { x: number; y: number; distance: number }
  obstacle: Obstacle
  obstacles: QuadtreeObstacleList
  OBSTACLE_MARGIN: number
  SHOULD_DETECT_CONJOINED_OBSTACLES: boolean
  MAX_CONJOINED_OBSTACLES: number
  obstaclesInRow: number
}): number {
  let distToOvercomeObstacle: number
  if (dir.x === 0) {
    if (dir.y > 0) {
      distToOvercomeObstacle = obstacle.center.y + obstacle.height / 2 - node.y
    } else {
      distToOvercomeObstacle =
        node.y - (obstacle.center.y - obstacle.height / 2)
    }
  } else {
    if (dir.x > 0) {
      distToOvercomeObstacle = obstacle.center.x + obstacle.width / 2 - node.x
    } else {
      distToOvercomeObstacle = node.x - (obstacle.center.x - obstacle.width / 2)
    }
  }
  distToOvercomeObstacle += OBSTACLE_MARGIN // + GRID_STEP

  if (
    SHOULD_DETECT_CONJOINED_OBSTACLES &&
    obstaclesInRow < MAX_CONJOINED_OBSTACLES
  ) {
    const obstacleAtEnd = obstacles.getObstacleAt(
      node.x +
        dir.x * distToOvercomeObstacle +
        orthoDir.x * (orthoDir.distance + 0.001),
      node.y +
        dir.y * distToOvercomeObstacle +
        orthoDir.y * (orthoDir.distance + 0.001),
    )
    if (obstacleAtEnd === obstacle) {
      return distToOvercomeObstacle
      // TODO Not sure why this happens, it does happen often
      throw new Error(
        "obstacleAtEnd === obstacle, we're bad at computing overcoming distance because it didn't overcome the obstacle",
      )
    }

    if (obstacleAtEnd && obstacleAtEnd.type === "rect") {
      // Make sure obstacle cannot block the path if the path is extended, this
      // is guaranteed if the obstacleAtEnd's dimension orthogonal to the path
      // we're traveling is smaller or equal to the previous obstacle's
      // orthogonal dimension
      // Said another way: The path could be blocked if the next conjoined
      // obstacle is bigger and is extending in the same direction as the path
      // https://github.com/tscircuit/autorouting-dataset/issues/31
      const extendingAlongXAxis = dir.y === 0
      const o1OrthoDim = extendingAlongXAxis ? obstacle.height : obstacle.width
      const o2OrthoDim = extendingAlongXAxis
        ? obstacleAtEnd.height
        : obstacleAtEnd.width

      if (o2OrthoDim > o1OrthoDim) {
        debug("next obstacle on path is bigger, not trying to overcome it")
        return distToOvercomeObstacle
      }

      const endObstacleDistToOvercome = getDistanceToOvercomeObstacle({
        node: {
          x: node.x + dir.x * distToOvercomeObstacle,
          y: node.y + dir.y * distToOvercomeObstacle,
        },
        dir,
        orthoDir,
        obstacle: obstacleAtEnd,
        obstacles,
        obstaclesInRow: obstaclesInRow + 1,
        SHOULD_DETECT_CONJOINED_OBSTACLES,
        MAX_CONJOINED_OBSTACLES,
        OBSTACLE_MARGIN,
      })
      distToOvercomeObstacle += endObstacleDistToOvercome
    }
  }

  return distToOvercomeObstacle
}
