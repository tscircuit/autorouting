// Import necessary types and functions
import { Quadtree, Rectangle, Line } from "@timohausmann/quadtree-ts"
import type { Obstacle } from "autorouting-dataset"
import { doesLineIntersectRectangle } from "./doesLineIntersectRectangle"

// Define a Point interface
interface Point {
  x: number
  y: number
}

/**
 * Finds a path between two points avoiding obstacles
 * @param start - Starting point
 * @param end - Ending point
 * @param obstacleQuadtree - Quadtree containing obstacle data
 * @param getOptimalPointsForObstacle - Function to get optimal points around an obstacle
 * @returns Array of points representing the path, or null if no path is found
 */
export function findPath(
  start: Point,
  end: Point,
  obstacleQuadtree: Quadtree<Rectangle<any>>,
  getOptimalPointsForObstacle: (obstacle: Obstacle, margin: number) => Point[],
): Point[] | null {
  // Initialize data structures for A* algorithm
  const openSet: Point[] = [start]
  const cameFrom: Map<string, Point> = new Map()
  const gScore: Map<string, number> = new Map()
  const fScore: Map<string, number> = new Map()

  // Set initial scores for start point
  gScore.set(pointToString(start), 0)
  fScore.set(pointToString(start), heuristic(start, end))

  while (openSet.length > 0) {
    // Get the point with the lowest fScore
    const current = getLowestFScore(openSet, fScore)
    // console.log("current", current, openSet)

    // If we've reached the end, reconstruct and return the path
    // TODO replace with points marked as end (because they were generated from
    // end obstacle)
    if (distance(current, end) < 0.7) {
      return reconstructPath(cameFrom, current).concat(end)
    }

    // Remove current point from openSet
    openSet.splice(openSet.indexOf(current), 1)

    // Get neighboring points
    const neighbors = getNeighbors(
      current,
      end,
      obstacleQuadtree,
      getOptimalPointsForObstacle,
    )

    // console.log("neighbors", neighbors)

    for (const neighbor of neighbors) {
      // Calculate tentative gScore
      const tentativeGScore =
        gScore.get(pointToString(current))! + distance(current, neighbor)

      // If this path to neighbor is better than any previous one, record it
      if (
        !gScore.has(pointToString(neighbor)) ||
        tentativeGScore < gScore.get(pointToString(neighbor))!
      ) {
        cameFrom.set(pointToString(neighbor), current)
        gScore.set(pointToString(neighbor), tentativeGScore)
        fScore.set(
          pointToString(neighbor),
          tentativeGScore + heuristic(neighbor, end),
        )

        // Add neighbor to openSet if it's not already there
        if (!openSet.some((p) => pointsEqual(p, neighbor))) {
          openSet.push(neighbor)
        }
      }
    }
  }

  // If we've exhausted all possibilities without finding the end, return null
  return null
}

/**
 * Gets neighboring points, including the end point and points around obstacles
 */
function getNeighbors(
  point: Point,
  end: Point,
  obstacleQuadtree: Quadtree<Rectangle<any>>,
  getOptimalPointsForObstacle: (obstacle: Obstacle, margin: number) => Point[],
): Point[] {
  const neighbors: Point[] = []
  const line = new Line({ x1: point.x, y1: point.y, x2: end.x, y2: end.y })

  // Get obstacles that might intersect with the direct path
  const relevantObstacles = obstacleQuadtree.retrieve(line)
  console.log("relevantObstacles", relevantObstacles.length)

  for (const item of relevantObstacles) {
    // If the direct path from the point to the end intersects an obstacle, add
    // optimal points around it
    if (doesLineIntersectRectangle(point.x, point.y, end.x, end.y, item)) {
      const obstacle = item.data as Obstacle
      const optimalPoints = getOptimalPointsForObstacle(obstacle, 0.3)
      console.log("optimalPoints", optimalPoints.length)
      // Make sure the optimal points have a direct path to the point (they
      // are actual neighbors)
      for (const optimalPoint of optimalPoints) {
        let isNeighbor = true
        for (const obstacle of relevantObstacles) {
          if (
            doesLineIntersectRectangle(
              optimalPoint.x,
              optimalPoint.y,
              point.x,
              point.y,
              obstacle,
            )
          ) {
            console.log("found intersection")
            isNeighbor = false
            break
          }
        }
        if (isNeighbor) {
          neighbors.push(optimalPoint)
        }
      }
    }
  }

  console.log("neighbors", neighbors.length)

  return neighbors
}

/**
 * Heuristic function for A* algorithm (in this case, straight-line distance)
 */
function heuristic(a: Point, b: Point): number {
  return distance(a, b)
}

/**
 * Calculates Euclidean distance between two points
 */
function distance(a: Point, b: Point): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2)
}

/**
 * Converts a point to a string for use as Map keys
 */
function pointToString(point: Point): string {
  return `${point.x},${point.y}`
}

/**
 * Checks if two points are equal
 */
function pointsEqual(a: Point, b: Point): boolean {
  return a.x === b.x && a.y === b.y
}

/**
 * Finds the point with the lowest fScore in the given set
 */
function getLowestFScore(points: Point[], fScore: Map<string, number>): Point {
  return points.reduce((min, p) =>
    (fScore.get(pointToString(p)) || Infinity) <
    (fScore.get(pointToString(min)) || Infinity)
      ? p
      : min,
  )
}

/**
 * Reconstructs the path from start to end using the cameFrom map
 */
function reconstructPath(
  cameFrom: Map<string, Point>,
  current: Point,
): Point[] {
  const path = [current]
  while (cameFrom.has(pointToString(current))) {
    current = cameFrom.get(pointToString(current))!
    path.unshift(current)
  }
  return path
}
