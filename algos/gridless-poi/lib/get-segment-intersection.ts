/**
 * Checks if lines given by (x1, y1) and (x2, y2) intersect with line
 * given by (x3, y3) and (x4, y4)
 */
export function getSegmentIntersection(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  x3: number,
  y3: number,
  x4: number,
  y4: number,
): [number, number] | null {
  const denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1)
  if (denom === 0) {
    // Lines are parallel

    if (x1 !== x2 && x3 !== x4) {
      const l1minx = Math.min(x1, x2)
      const l1maxx = Math.max(x1, x2)
      const l2minx = Math.min(x3, x4)
      const l2maxx = Math.max(x3, x4)
      if (l1minx <= l2maxx && l1maxx >= l2minx) {
        // Lines overlap
        return [l1minx, l1minx]
      }
    } else {
      const l1miny = Math.min(y1, y2)
      const l1maxy = Math.max(y1, y2)
      const l2miny = Math.min(y3, y4)
      const l2maxy = Math.max(y3, y4)
      if (l1miny <= l2maxy && l1maxy >= l2miny) {
        // Lines overlap
        return [l1miny, l1miny]
      }
    }

    return null // Parallel, but not overlapping
  }

  const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom
  const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denom

  if (ua < 0 || ua > 1 || ub < 0 || ub > 1) return null // intersection outside of line segments

  return [x1 + ua * (x2 - x1), y1 + ua * (y2 - y1)]
}
