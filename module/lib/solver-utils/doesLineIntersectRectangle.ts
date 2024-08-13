export function doesLineIntersectRectangle(
  line: { x1: number; y1: number; x2: number; y2: number },
  rect: { minX: number; minY: number; width: number; height: number },
): boolean {
  const { x1, y1, x2, y2 } = line
  const { minX, minY, width, height } = rect
  // Check intersection with all four sides of the rectangle
  return (
    segmentIntersection(x1, y1, x2, y2, minX, minY, minX + width, minY) ||
    segmentIntersection(
      x1,
      y1,
      x2,
      y2,
      minX + width,
      minY,
      minX + width,
      minY + height,
    ) ||
    segmentIntersection(
      x1,
      y1,
      x2,
      y2,
      minX + width,
      minY + height,
      minX,
      minY + height,
    ) ||
    segmentIntersection(x1, y1, x2, y2, minX, minY + height, minX, minY)
  )
}

function segmentIntersection(
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
