export type Direction3d = {
  dx: number
  dy: number
  /**
   * Always integer, usually -1 or 1, -1 indicating to go towards the top layer,
   * 1 indicating to go down a layer towards the bottom layer
   */
  dl: number
}

export interface Direction {
  dx: number
  dy: number
  dl: number // Added for layer movement
}

export interface Point {
  x: number
  y: number
  l: number // Layer
}
