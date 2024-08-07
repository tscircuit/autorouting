import { Graph } from "@dagrejs/graphlib"
import { getSegmentIntersection } from "./get-segment-intersection"

interface Point {
  x: number
  y: number
  nodeName?: string
}

interface Obstacle {
  type: "rect" | "oval"
  center: { x: number; y: number }
  width: number
  height: number
  connectedTo: string[]
}

export const constructGraphFromPois = (
  pointsOfInterest: Point[],
  obstacles: Obstacle[],
): Graph => {
  const G = new Graph({ directed: false })

  for (let i = 0; i < pointsOfInterest.length; i++) {
    G.setNode(i.toString(), {
      x: pointsOfInterest[i].x,
      y: pointsOfInterest[i].y,
    })
    pointsOfInterest[i].nodeName = i.toString()
  }

  function addEdgeToGraph(p1: Point, p2: Point) {
    let intersects = false

    for (const obstacle of obstacles) {
      if (obstacle.type === "rect") {
        // Convert rectangle to line segments
        const halfWidth = obstacle.width / 2
        const halfHeight = obstacle.height / 2
        const topLeft = {
          x: obstacle.center.x - halfWidth,
          y: obstacle.center.y - halfHeight,
        }
        const topRight = {
          x: obstacle.center.x + halfWidth,
          y: obstacle.center.y - halfHeight,
        }
        const bottomLeft = {
          x: obstacle.center.x - halfWidth,
          y: obstacle.center.y + halfHeight,
        }
        const bottomRight = {
          x: obstacle.center.x + halfWidth,
          y: obstacle.center.y + halfHeight,
        }

        // Check intersection with all four sides of the rectangle
        const sides = [
          [topLeft, topRight],
          [topRight, bottomRight],
          [bottomRight, bottomLeft],
          [bottomLeft, topLeft],
        ]

        for (const [start, end] of sides) {
          if (
            getSegmentIntersection(
              p1.x,
              p1.y,
              p2.x,
              p2.y,
              start.x,
              start.y,
              end.x,
              end.y,
            )
          ) {
            intersects = true
            break
          }
        }

        if (intersects) break
      }
    }

    if (!intersects) {
      const d = Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2)
      G.setEdge(p1.nodeName!, p2.nodeName!, { d })
    }
  }

  for (let i = 0; i < pointsOfInterest.length; i++) {
    for (let u = i + 1; u < pointsOfInterest.length; u++) {
      addEdgeToGraph(pointsOfInterest[i], pointsOfInterest[u])
    }
  }

  return G
}
