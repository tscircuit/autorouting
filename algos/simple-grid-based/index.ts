import { Grid, AStarFinder, DiagonalMovement } from "pathfinding"
import { getSimpleRouteJson, SimplifiedPcbTrace } from "autorouting-dataset"
import type { AnySoupElement } from "@tscircuit/soup"

export function autoroute(soup: AnySoupElement[]): SimplifiedPcbTrace[] {
  const input = getSimpleRouteJson(soup)
  const gridSize = 0.1 // Assume 1 unit grid size
  const bufferSize = 0
  const boundsWithBuffer = {
    minX: input.bounds.minX - bufferSize,
    maxX: input.bounds.maxX + bufferSize,
    minY: input.bounds.minY - bufferSize,
    maxY: input.bounds.maxY + bufferSize,
  }
  const width =
    Math.ceil((boundsWithBuffer.maxX - boundsWithBuffer.minX) / gridSize) + 1
  const height =
    Math.ceil((boundsWithBuffer.maxY - boundsWithBuffer.minY) / gridSize) + 1

  // Initialize grids for each layer
  const grids = Array.from(
    { length: input.layerCount },
    () => new Grid(width, height),
  )

  // Mark obstacles
  input.obstacles.forEach((obstacle) => {
    const left = Math.floor(
      (obstacle.center.x - obstacle.width / 2 - boundsWithBuffer.minX) /
        gridSize,
    )
    const right = Math.ceil(
      (obstacle.center.x + obstacle.width / 2 - boundsWithBuffer.minX) /
        gridSize,
    )
    const top = Math.floor(
      (obstacle.center.y - obstacle.height / 2 - boundsWithBuffer.minY) /
        gridSize,
    )
    const bottom = Math.ceil(
      (obstacle.center.y + obstacle.height / 2 - boundsWithBuffer.minY) /
        gridSize,
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

    // Create a clone of the current grid for this connection
    const connectionGrid = grids[currentLayer].clone()

    // Make obstacles walkable if they are connected to this trace
    input.obstacles.forEach((obstacle) => {
      if (obstacle.connectedTo.includes(connection.name)) {
        const left = Math.floor(
          (obstacle.center.x - obstacle.width / 2 - boundsWithBuffer.minX) /
            gridSize,
        )
        const right = Math.ceil(
          (obstacle.center.x + obstacle.width / 2 - boundsWithBuffer.minX) /
            gridSize,
        )
        const top = Math.floor(
          (obstacle.center.y - obstacle.height / 2 - boundsWithBuffer.minY) /
            gridSize,
        )
        const bottom = Math.ceil(
          (obstacle.center.y + obstacle.height / 2 - boundsWithBuffer.minY) /
            gridSize,
        )

        for (let x = left; x <= right; x++) {
          for (let y = top; y <= bottom; y++) {
            connectionGrid.setWalkableAt(x, y, true)
          }
        }
      }
    })

    for (let i = 0; i < connection.pointsToConnect.length - 1; i++) {
      const start = connection.pointsToConnect[i]
      const end = connection.pointsToConnect[i + 1]

      const startX = Math.round((start.x - boundsWithBuffer.minX) / gridSize)
      const startY = Math.round((start.y - boundsWithBuffer.minY) / gridSize)
      const endX = Math.round((end.x - boundsWithBuffer.minX) / gridSize)
      const endY = Math.round((end.y - boundsWithBuffer.minY) / gridSize)

      const path = finder.findPath(
        startX,
        startY,
        endX,
        endY,
        connectionGrid.clone(),
      )

      if (path.length > 0) {
        path.forEach((point, index) => {
          const x = point[0] * gridSize + boundsWithBuffer.minX
          const y = point[1] * gridSize + boundsWithBuffer.minY

          if (index > 0) {
            route.push({
              route_type: "wire",
              x,
              y,
              width: 0.08, // Assuming a default width
              layer: "top", // TODO create layer map for "top", "bottom", "inner1", "inner2" etc.
              // layer: `layer${currentLayer + 1}`,
            })
          }
        })

        // Mark the path as occupied
        path.forEach((point) => {
          connectionGrid.setWalkableAt(point[0], point[1], false)
          grids[currentLayer].setWalkableAt(point[0], point[1], false)
        })
      }
    }

    if (route.length > 0) {
      solution.push({
        type: "pcb_trace",
        pcb_trace_id: `pcb_trace_for_${connection.name}`,
        route,
      })
    }
  })

  return solution
}
