import { Grid, AStarFinder, DiagonalMovement } from "pathfinding"
import { getSimpleRouteJson, SimplifiedPcbTrace } from "autorouting-dataset"
import type { AnySoupElement } from "@tscircuit/soup"

export function autoroute(soup: AnySoupElement[]): SimplifiedPcbTrace[] {
  const input = getSimpleRouteJson(soup)
  const gridSize = 1 // Assume 1 unit grid size
  const width =
    Math.ceil((input.bounds.maxX - input.bounds.minX) / gridSize) + 1
  const height =
    Math.ceil((input.bounds.maxY - input.bounds.minY) / gridSize) + 1

  // Initialize grids for each layer
  const grids = Array.from(
    { length: input.layerCount },
    () => new Grid(width, height),
  )

  // Mark obstacles
  input.obstacles.forEach((obstacle) => {
    const left = Math.floor(
      (obstacle.center.x - obstacle.width / 2 - input.bounds.minX) / gridSize,
    )
    const right = Math.ceil(
      (obstacle.center.x + obstacle.width / 2 - input.bounds.minX) / gridSize,
    )
    const top = Math.floor(
      (obstacle.center.y - obstacle.height / 2 - input.bounds.minY) / gridSize,
    )
    const bottom = Math.ceil(
      (obstacle.center.y + obstacle.height / 2 - input.bounds.minY) / gridSize,
    )

    for (let x = left; x <= right; x++) {
      for (let y = top; y <= bottom; y++) {
        grids.forEach((grid) => grid.setWalkableAt(x, y, false))
      }
    }
  })

  const finder = new AStarFinder({
    diagonalMovement: DiagonalMovement.Never,
  })

  const solution: SimplifiedPcbTrace[] = []

  input.connections.forEach((connection) => {
    const route: SimplifiedPcbTrace["route"] = []
    let currentLayer = 0

    for (let i = 0; i < connection.pointsToConnect.length - 1; i++) {
      const start = connection.pointsToConnect[i]
      const end = connection.pointsToConnect[i + 1]

      const startX = Math.round((start.x - input.bounds.minX) / gridSize)
      const startY = Math.round((start.y - input.bounds.minY) / gridSize)
      const endX = Math.round((end.x - input.bounds.minX) / gridSize)
      const endY = Math.round((end.y - input.bounds.minY) / gridSize)

      console.log("running pathfinding", i)

      const path = finder.findPath(
        startX,
        startY,
        endX,
        endY,
        grids[currentLayer].clone(),
      )

      if (path.length > 0) {
        path.forEach((point, index) => {
          const x = point[0] * gridSize + input.bounds.minX
          const y = point[1] * gridSize + input.bounds.minY

          if (index > 0) {
            route.push({
              route_type: "wire",
              x,
              y,
              width: 0.1, // Assuming a default width
              layer: `layer${currentLayer + 1}`,
            })
          }
        })

        // Mark the path as occupied
        path.forEach((point) => {
          grids[currentLayer].setWalkableAt(point[0], point[1], false)
        })
      }
    }

    if (route.length > 0) {
      solution.push({
        type: "pcb_trace",
        route,
      })
    }
  })

  return solution
}
