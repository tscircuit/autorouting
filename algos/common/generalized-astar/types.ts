import type { Obstacle } from "autorouting-dataset/lib/types"

export type Direction3d = {
  dx: number
  dy: number
  /**
   * Always integer, usually -1 or 1, -1 indicating to go towards the top layer,
   * 1 indicating to go down a layer towards the bottom layer
   */
  dl: number
}

export interface Point3d {
  x: number
  y: number
  l: number // Layer
}

export interface Point3dWithObstacleHit extends Point3d {
  obstacleHit?: Obstacle | null
}

export interface Node3d extends Node {
  l: number
  parent: Node3d | null
}

export interface Obstacle3d extends Obstacle {
  l: number
}

export interface ObstacleWithEdges3d extends Obstacle3d {
  top: number
  bottom: number
  left: number
  right: number
}

export interface DirectionWithCollisionInfo3d extends Direction3d {
  wallDistance: number
  obstacle: Obstacle | null
}

export interface DirectionDistances3d {
  left: number
  top: number
  bottom: number
  right: number
}

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

  /**
   * Used in multi-margin autorouter to penalize traveling close to the wall
   */
  travelMarginCostFactor?: number
  enterMarginCost?: number
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

  /**
   * Used in multi-margin autorouter to penalize traveling close to the wall
   */
  travelMarginCostFactor?: number
  enterMarginCost?: number

  /**
   * Layer index, not needed for single-layer autorouters
   */
  l?: number
}
