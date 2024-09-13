import type { Point } from "../types"

interface PointWithLayer {
  x: number
  y: number
  layer: string
}

export function removePathLoops<T extends PointWithLayer>(path: T[]): T[] {
  if (path.length < 4) return path // No loops possible with less than 4 points

  const result: PointWithLayer[] = [path[0]]

  for (let i = 1; i < path.length; i++) {
    const currentSegment = { start: path[i - 1], end: path[i] }

    let intersectionFound = false
    let intersectionPoint: PointWithLayer | null = null
    let intersectionIndex = -1

    // Check for intersections with all previous segments
    for (let j = 0; j < result.length - 1; j++) {
      const previousSegment = { start: result[j], end: result[j + 1] }
      if (previousSegment.start.layer !== currentSegment.start.layer) {
        continue
      }
      const intersection = findIntersection(previousSegment, currentSegment)

      if (intersection) {
        intersectionFound = true
        intersectionPoint = {
          ...intersection,
          layer: previousSegment.start.layer,
        }
        intersectionIndex = j
        break
      }
    }

    if (intersectionFound && intersectionPoint) {
      // Remove the loop
      result.splice(intersectionIndex + 1)
      // Add the intersection point
      result.push(intersectionPoint)
    }

    // Add the current point if it's not the same as the last point in result
    const lastPoint = result[result.length - 1]
    if (lastPoint.x !== path[i].x || lastPoint.y !== path[i].y) {
      result.push(path[i])
    }
  }

  return result as T[]
}

function findIntersection(
  segment1: { start: Point; end: Point },
  segment2: { start: Point; end: Point },
): Point | null {
  // Check if segments are parallel
  if (
    (segment1.start.x === segment1.end.x &&
      segment2.start.x === segment2.end.x) ||
    (segment1.start.y === segment1.end.y && segment2.start.y === segment2.end.y)
  ) {
    return null
  }

  // Find intersection point
  let intersectionPoint: Point

  if (segment1.start.x === segment1.end.x) {
    const x = segment1.start.x
    const y = segment2.start.y
    intersectionPoint = { ...segment1.start, x, y }
  } else {
    const x = segment2.start.x
    const y = segment1.start.y
    intersectionPoint = { ...segment1.start, x, y }
  }

  // Check if intersection point is within both segments
  if (
    isPointInSegment(intersectionPoint, segment1) &&
    isPointInSegment(intersectionPoint, segment2)
  ) {
    return intersectionPoint
  }

  return null
}

function isPointInSegment(
  point: Point,
  segment: { start: Point; end: Point },
): boolean {
  return (
    point.x >= Math.min(segment.start.x, segment.end.x) &&
    point.x <= Math.max(segment.start.x, segment.end.x) &&
    point.y >= Math.min(segment.start.y, segment.end.y) &&
    point.y <= Math.max(segment.start.y, segment.end.y)
  )
}
