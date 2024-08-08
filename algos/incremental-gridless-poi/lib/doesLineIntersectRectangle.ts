import { Rectangle } from "@timohausmann/quadtree-ts"

export function doesLineIntersectRectangle(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  rect: Rectangle<any>,
): boolean {
  // Check if either endpoint is inside the rectangle
  if (
    (x1 >= rect.x &&
      x1 <= rect.x + rect.width &&
      y1 >= rect.y &&
      y1 <= rect.y + rect.height) ||
    (x2 >= rect.x &&
      x2 <= rect.x + rect.width &&
      y2 >= rect.y &&
      y2 <= rect.y + rect.height)
  ) {
    return true
  }

  // Check intersection with all four sides of the rectangle
  return (
    lineIntersectsLine(
      x1,
      y1,
      x2,
      y2,
      rect.x,
      rect.y,
      rect.x + rect.width,
      rect.y,
    ) ||
    lineIntersectsLine(
      x1,
      y1,
      x2,
      y2,
      rect.x + rect.width,
      rect.y,
      rect.x + rect.width,
      rect.y + rect.height,
    ) ||
    lineIntersectsLine(
      x1,
      y1,
      x2,
      y2,
      rect.x + rect.width,
      rect.y + rect.height,
      rect.x,
      rect.y + rect.height,
    ) ||
    lineIntersectsLine(
      x1,
      y1,
      x2,
      y2,
      rect.x,
      rect.y + rect.height,
      rect.x,
      rect.y,
    )
  )
}

export function lineIntersectsLine(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  x3: number,
  y3: number,
  x4: number,
  y4: number,
): boolean {
  const denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1)
  if (denom === 0) {
    return false // parallel lines
  }
  const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom
  const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denom
  return ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1
}
