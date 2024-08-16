import type { Obstacle } from "autorouting-dataset"
import Debug from "debug"
import type {
  Direction,
  DirectionWithWallDistance,
  PointWithWallDistance,
} from "./types"
import type { ObstacleList } from "./ObstacleList"

const debug = Debug(
  "autorouting-dataset:infinite-grid-ijump-astar:get-distance-to-overcome-obstacle",
)

export function getDistanceToOvercomeObstacle({
  node,
  travelDir,
  wallDir,
  obstacle,
  obstacles,
  obstaclesInRow = 0,
  OBSTACLE_MARGIN = 0.15,
  SHOULD_DETECT_CONJOINED_OBSTACLES = false,
  MAX_CONJOINED_OBSTACLES = 20,
}: {
  node: { x: number; y: number }
  travelDir: DirectionWithWallDistance
  wallDir: DirectionWithWallDistance
  obstacle: Obstacle
  obstacles: ObstacleList
  OBSTACLE_MARGIN: number
  SHOULD_DETECT_CONJOINED_OBSTACLES?: boolean
  MAX_CONJOINED_OBSTACLES?: number
  obstaclesInRow?: number
}): number {
  let distToOvercomeObstacle: number
  if (travelDir.dx === 0) {
    if (travelDir.dy > 0) {
      distToOvercomeObstacle = obstacle.center.y + obstacle.height / 2 - node.y
    } else {
      distToOvercomeObstacle =
        node.y - (obstacle.center.y - obstacle.height / 2)
    }
  } else {
    if (travelDir.dx > 0) {
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
    // TODO: we need to detect all possible obstacles between the wallDistance
    // and the node at the end of the distToOvercomeObstacle, there could be
    // multiple obstacles that could interrupt the path of the node at it's
    // next turn
    // http://localhost:3080/problem/traces/18#t2_iter[14] is a great example
    // of a path being too close because of a bad distToOvercomeObstacle b/c
    // of missing detection of obstacles within the wallDistance
    const obstacleAtEnd = obstacles.getObstacleAt(
      node.x +
        travelDir.dx * distToOvercomeObstacle +
        wallDir.dx * (wallDir.wallDistance + 0.001),
      node.y +
        travelDir.dy * distToOvercomeObstacle +
        wallDir.dy * (wallDir.wallDistance + 0.001),
    )
    // const obstaclesAtEnd = obstacles.getObstaclesOverlappingRegion({
    //   minX: node.x + travelDir.dx * distToOvercomeObstacle,
    //   minY: node.y + travelDir.dy * distToOvercomeObstacle,
    //   maxX:
    //     node.x +
    //     travelDir.dx * distToOvercomeObstacle +
    //     wallDir.dx * wallDir.wallDistance,
    //   maxY:
    //     node.y +
    //     travelDir.dy * distToOvercomeObstacle +
    //     wallDir.dy * wallDir.wallDistance,
    // })

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
      const extendingAlongXAxis = travelDir.dy === 0
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
          x: node.x + travelDir.dx * distToOvercomeObstacle,
          y: node.y + travelDir.dy * distToOvercomeObstacle,
        },
        travelDir: travelDir,
        wallDir: wallDir,
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
