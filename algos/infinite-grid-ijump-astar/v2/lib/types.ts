import type { Obstacle } from "autorouting-dataset"

export interface DirectionDistances {
  left: number
  top: number
  bottom: number
  right: number
}

export interface Direction {
  dx: number
  dy: number
}

export interface DirectionWithWallDistance extends Direction {
  wallDistance: number
}

export interface DirectionWithCollisionInfo extends Direction {
  wallDistance: number
  obstacle: Obstacle | null
}

export interface Point {
  x: number
  y: number
}

export interface PointWithObstacleHit extends Point {
  obstacleHit?: Obstacle | null
}

export interface PointWithWallDistance extends Point {
  wallDistance: number
}

export interface Node extends Point {
  /** Distance from the parent node (along path) */
  g: number
  /** Heuristic distance from the goal */
  h: number
  /** Distance score for this node (g + h) */
  f: number
  /** Manhattan Distance from the parent node */
  manDistFromParent: number
  nodesInPath: number
  obstacleHit?: Obstacle
  parent: Node | null
}
