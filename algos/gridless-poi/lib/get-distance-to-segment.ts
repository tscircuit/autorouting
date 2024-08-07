export function getDistanceToSegment(
  p: { x: number; y: number },
  line: { x1: number; y1: number; x2: number; y2: number },
): number {
  const { x, y } = p
  const { x1, y1, x2, y2 } = line

  // Calculate the length of the line segment squared
  const lengthSquared = (x2 - x1) ** 2 + (y2 - y1) ** 2

  // If the line segment has zero length, return distance to one of its endpoints
  if (lengthSquared === 0) return Math.sqrt((x - x1) ** 2 + (y - y1) ** 2)

  // Calculate the t that minimizes the distance
  let t = ((x - x1) * (x2 - x1) + (y - y1) * (y2 - y1)) / lengthSquared

  // Clamp t to the range [0, 1]
  t = Math.max(0, Math.min(1, t))

  // Calculate the projection point
  const projX = x1 + t * (x2 - x1)
  const projY = y1 + t * (y2 - y1)

  // Calculate the distance between the point and the projection
  return Math.sqrt((x - projX) ** 2 + (y - projY) ** 2)
}
