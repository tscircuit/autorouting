import type { Node } from "algos/infinite-grid-ijump-astar/v2/lib/types"
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
