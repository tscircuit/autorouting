import { getSegmentIntersection } from "./getSegmentIntersection"

export function getLineRectangleIntersection(
  line: { x1: number; y1: number; x2: number; y2: number },
  rect: { minX: number; minY: number; width: number; height: number },
): { x: number; y: number } | null {
  const { x1, y1, x2, y2 } = line
  const { minX, minY, width, height } = rect
  // Check intersection with all four sides of the rectangle
  return (
    getSegmentIntersection(x1, y1, x2, y2, minX, minY, minX + width, minY) ||
    getSegmentIntersection(
      x1,
      y1,
      x2,
      y2,
      minX + width,
      minY,
      minX + width,
      minY + height,
    ) ||
    getSegmentIntersection(
      x1,
      y1,
      x2,
      y2,
      minX + width,
      minY + height,
      minX,
      minY + height,
    ) ||
    getSegmentIntersection(x1, y1, x2, y2, minX, minY + height, minX, minY)
  )
}
