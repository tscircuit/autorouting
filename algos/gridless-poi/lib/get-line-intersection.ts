// @ts-ignore i don't think this file is used
import { findRootsBisection } from "./find-roots-bisection"
// @ts-ignore i don't think this file is used
import { findRootsNewtonRaphson } from "./find-roots-newton-raphson"

/**
 * Finds the intersection points between a polynomial curve and a line segment.
 * @param x1 - x-coordinate of the first point of the line segment
 * @param y1 - y-coordinate of the first point of the line segment
 * @param x2 - x-coordinate of the second point of the line segment
 * @param y2 - y-coordinate of the second point of the line segment
 * @returns Array of intersection points, or null if no intersection
 */
export function getLineIntersection(
  fn: (x: number) => number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): [number, number, number][] | null {
  // Step 1: Find the line equation y = mx + b
  let m = (y2 - y1) / (x2 - x1)
  if (m === Infinity || m === -Infinity) {
    // vertical line, the intersection is then the x-coordinate of the
    // vertical line
    const y = fn(x1)
    if (y > Math.min(y1, y2) && y < Math.max(y1, y2)) {
      return [[x1, y, 999]]
    }
    return []
  }
  const b = y1 - m * x1

  // Step 2: Set up the polynomial equation
  const equation = (x: number) => {
    return fn(x) - (m * x + b)
  }

  // Step 3: Find roots of the polynomial equation
  const roots = findRootsNewtonRaphson(
    equation,
    Math.min(x1, x2) - 0.01,
    Math.max(x1, x2) + 0.01,
  )

  // Step 4: Check if roots are within the line segment
  const intersections = roots
    .filter((x: any) => x >= Math.min(x1, x2) && x <= Math.max(x1, x2))
    .map((x: any) => [x, m * x + b, m] as [number, number, number])

  return intersections.length > 0 ? intersections : null
}
