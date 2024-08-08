import type { AnySoupElement } from "@tscircuit/soup"
import type { Obstacle, SimplifiedPcbTrace } from "autorouting-dataset"
import { getSimpleRouteJson } from "autorouting-dataset"
import Debug from "debug"
import { Quadtree, Rectangle } from "@timohausmann/quadtree-ts"
import { Timer } from "autorouting-dataset/lib/solver-utils/timer"
import { getOptimalPointsForObstacle } from "./lib/getOptimalPointsForObstacle"
import { findPath } from "./lib/findPath"
import { doesLineIntersectRectangle } from "./lib/doesLineIntersectRectangle"

const debug = Debug("autorouting-dataset:incremental-gridless-poi")

export function autoroute(soup: AnySoupElement[]): SimplifiedPcbTrace[] {
  const timer = new Timer({ logOnEnd: debug.enabled })
  timer.start("getSimpleRouteJson")
  const input = getSimpleRouteJson(soup)
  timer.end()

  const solution: SimplifiedPcbTrace[] = []

  // Create quadtree for obstacles
  timer.start("createQuadtree")
  const bounds = input.bounds
  const obstacleQuadtree = new Quadtree<Rectangle<Obstacle>>({
    x: bounds.minX,
    y: bounds.minY,
    width: bounds.maxX - bounds.minX,
    height: bounds.maxY - bounds.minY,
    maxObjects: 8,
    maxLevels: 5,
  })

  // Insert obstacles into the quadtree
  for (const obstacle of input.obstacles) {
    const rect = new Rectangle<Obstacle>({
      x: obstacle.center.x - obstacle.width / 2,
      y: obstacle.center.y - obstacle.height / 2,
      width: obstacle.width,
      height: obstacle.height,
      data: obstacle,
    })
    obstacleQuadtree.insert(rect)
  }
  timer.end()

  // Route each connection
  for (const connection of input.connections) {
    timer.start(`routing connection ${connection.name}`)
    const start = connection.pointsToConnect[0]
    const end =
      connection.pointsToConnect[connection.pointsToConnect.length - 1]

    // Remove obstacles from the quadtree that contain the start and end points

    const path = findPath(
      start,
      end,
      obstacleQuadtree,
      getOptimalPointsForObstacle,
    )

    if (path) {
      solution.push({
        type: "pcb_trace",
        pcb_trace_id: `pcb_trace_for_${connection.name}`,
        route: path.map((point) => ({
          route_type: "wire",
          x: point.x,
          y: point.y,
          width: 0.08,
          layer: "top",
        })),
      })
    } else {
      debug(`Failed to find path for connection ${connection.name}`)
    }
    timer.end()
  }

  return solution
}
