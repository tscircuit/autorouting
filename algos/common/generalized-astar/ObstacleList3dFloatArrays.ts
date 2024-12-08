import type { Obstacle } from "solver-utils"
import { ObstacleList3d } from "./ObstacleList3d"

export class ObstacleList3dFloatArrays extends ObstacleList3d {
  /**
   * This is a flattened representation of obstacles, each obstacle is
   * represented like so:
   * [ left, top, right, bottom ]
   */
  obstaclesF64: Float64Array

  constructor(layerCount: number, obstacles: Array<Obstacle>) {
    super(layerCount, obstacles)

    // Create float64 representation of obstacles
    const internalObstacles = this.obstacles

    this.obstaclesF64 = new Float64Array(internalObstacles.length * 4)

    for (let i = 0; i < internalObstacles.length; i++) {
      const obstacle = internalObstacles[i]
      this.obstaclesF64[i * 5] = obstacle.left
      this.obstaclesF64[i * 5 + 1] = obstacle.top
      this.obstaclesF64[i * 5 + 2] = obstacle.right
      this.obstaclesF64[i * 5 + 3] = obstacle.bottom
    }
  }

  // getObstacleAt(x: number, y: number, l: number, m?: number): Obstacle | null {}
}
