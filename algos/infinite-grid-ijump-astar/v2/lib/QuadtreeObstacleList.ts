import type { Edge, Obstacle, ObstacleWithEdges } from "autorouting-dataset"
import type { DirectionDistances } from "./types"
import { ObstacleList } from "./ObstacleList"
import { Quadtree, Rectangle, Circle, Line } from "@timohausmann/quadtree-ts"

/**
 * A list of obstacles with functions for fast lookups using QuadTree
 *
 * NOTE: THIS IS SLOWER THAN ObstacleList, NOT SURE WHY YET- QUADTREE SHOULD
 * BE FASTER?!
 */
export class QuadtreeObstacleList extends ObstacleList {
  private quadtree: Quadtree<Rectangle<ObstacleWithEdges>>
  private MAX_DIRECTION_DISTANCE_SEARCH_AREA = 16

  constructor(obstacles: Array<Obstacle>) {
    super(obstacles)

    // Initialize QuadTree with the bounding box of all obstacles
    const bounds = this.calculateBounds(this.obstacles)
    this.quadtree = new Quadtree<Rectangle<ObstacleWithEdges>>({
      ...bounds,
      maxObjects: 10,
    })

    // Insert obstacles into QuadTree
    for (const obstacle of this.obstacles) {
      const { center, width, height } = obstacle
      this.quadtree.insert(
        new Rectangle({
          x: obstacle.left,
          y: obstacle.top,
          width,
          height,
          data: obstacle,
        }),
      )
    }
  }

  private calculateBounds(obstacles: Array<ObstacleWithEdges>): Rectangle {
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity

    for (const obstacle of obstacles) {
      minX = Math.min(minX, obstacle.left)
      minY = Math.min(minY, obstacle.bottom)
      maxX = Math.max(maxX, obstacle.right)
      maxY = Math.max(maxY, obstacle.top)
    }

    return new Rectangle({
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    })
  }

  getObstacleAt(x: number, y: number, m?: number): Obstacle | null {
    m ??= this.GRID_STEP

    const candidates = this.quadtree.retrieve(
      new Rectangle({ x, y, width: 0.001, height: 0.001 }),
    )

    for (const candidate of candidates) {
      if (candidate instanceof Rectangle) {
        const obstacle = candidate.data as ObstacleWithEdges

        if (
          x >= obstacle.left - m &&
          x <= obstacle.right + m &&
          y >= obstacle.bottom - m &&
          y <= obstacle.top + m
        ) {
          return obstacle
        }
      }
    }

    return null
  }

  isObstacleAt(x: number, y: number): boolean {
    return this.getObstacleAt(x, y) !== null
  }

  getDirectionDistancesToNearestObstacle(
    x: number,
    y: number,
  ): DirectionDistances {
    const { GRID_STEP } = this
    const result: DirectionDistances = {
      left: Infinity,
      top: Infinity,
      bottom: Infinity,
      right: Infinity,
    }

    for (const dir of [
      { x: -1, y: 0, dName: "left", oEdge: "right" },
      { x: 1, y: 0, dName: "right", oEdge: "left" },
      { x: 0, y: -1, dName: "bottom", oEdge: "top" },
      { x: 0, y: 1, dName: "top", oEdge: "bottom" },
    ] as Array<{ x: number; y: number; dName: Edge; oEdge: Edge }>) {
      let minSearchDist = 0
      let maxSearchDist = 0.5
      while (maxSearchDist < this.MAX_DIRECTION_DISTANCE_SEARCH_AREA) {
        const obstacles: ObstacleWithEdges[] = this.quadtree
          .retrieve(
            new Line({
              x1: x + dir.x * minSearchDist,
              y1: y + dir.y * minSearchDist,
              x2: x + dir.x * maxSearchDist,
              y2: y + dir.y * maxSearchDist,
            }),
          )
          .map((candidate) => candidate.data!)

        if (obstacles.length === 0) {
          minSearchDist = maxSearchDist
          maxSearchDist *= 2
          continue
        }

        result[dir.dName] = Math.min(
          ...obstacles.map((obstacle) => obstacle[dir.oEdge]),
        )
      }
    }

    return result
  }
}
