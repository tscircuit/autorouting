import { Graph } from "@dagrejs/graphlib"
import { Delaunay } from "d3-delaunay"
import { Quadtree, Rectangle, Line } from "@timohausmann/quadtree-ts"
import { Timer } from "autorouting-dataset/lib/solver-utils/timer"
import { doesLineIntersectRectangle } from "./does-line-intersect-rectangle"
import now from "performance-now"
import Debug from "debug"

const debug = Debug("autorouting-dataset:gridless-poi:construct-graph")

interface Point {
  x: number
  y: number
  nodeName?: string
}

interface Obstacle {
  type: "rect"
  center: { x: number; y: number }
  width: number
  height: number
  connectedTo: string[]
}

export const constructGraphFromPoisWithDelaunay = (
  pointsOfInterest: Point[],
  obstacles: Obstacle[],
): Graph => {
  const T = new Timer({ logOnEnd: debug.enabled })
  const G = new Graph({ directed: false })

  // Find the bounds of the entire space
  T.start("quadtree bounds + construction")
  const allPoints = [
    ...pointsOfInterest,
    ...obstacles.map((o) => ({
      x: o.center.x - o.width / 2,
      y: o.center.y - o.height / 2,
    })),
    ...obstacles.map((o) => ({
      x: o.center.x + o.width / 2,
      y: o.center.y + o.height / 2,
    })),
  ]
  const minX = Math.min(...allPoints.map((p) => p.x))
  const minY = Math.min(...allPoints.map((p) => p.y))
  const maxX = Math.max(...allPoints.map((p) => p.x))
  const maxY = Math.max(...allPoints.map((p) => p.y))

  // Create quadtree for obstacles
  const obstacleQuadtree = new Quadtree<Rectangle<Obstacle>>({
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
    maxObjects: 10,
    maxLevels: 4,
  })
  T.end()

  T.start("add points to graph")
  // Add points to the graph
  for (let i = 0; i < pointsOfInterest.length; i++) {
    const point = pointsOfInterest[i]
    G.setNode(i.toString(), { x: point.x, y: point.y })
    point.nodeName = i.toString()
  }
  T.end()

  // Insert obstacles into the obstacle quadtree
  T.start("insert obstacles into quadtree")
  for (const obstacle of obstacles) {
    const rect = new Rectangle({
      x: obstacle.center.x - obstacle.width / 2,
      y: obstacle.center.y - obstacle.height / 2,
      width: obstacle.width,
      height: obstacle.height,
      data: obstacle,
    })
    obstacleQuadtree.insert(rect)
  }
  T.end()

  let timeCosts = {
    delaunayConstruction: 0,
    findingRelevantObstacles: 0,
    checkingIntersections: 0,
    addingEdges: 0,
  }

  function addEdgeToGraph(p1: Point, p2: Point) {
    const line = new Line({
      x1: p1.x,
      y1: p1.y,
      x2: p2.x,
      y2: p2.y,
    })

    // Retrieve only relevant obstacles
    let start = now()
    const relevantObstacles = obstacleQuadtree.retrieve(line)
    timeCosts.findingRelevantObstacles += now() - start

    // Check for intersection with relevant obstacles
    start = now()
    for (const item of relevantObstacles) {
      const obstacle = item.data!
      const obstacleRect = new Rectangle({
        x: item.x,
        y: item.y,
        width: obstacle.width,
        height: obstacle.height,
      })
      if (
        doesLineIntersectRectangle(line.x1, line.y1, line.x2, line.y2, {
          minX: obstacleRect.x,
          minY: obstacleRect.y,
          width: obstacleRect.width,
          height: obstacleRect.height,
        })
      ) {
        return
      }
    }
    timeCosts.checkingIntersections += now() - start

    const d = Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2)
    start = now()
    G.setEdge(p1.nodeName!, p2.nodeName!, { d })
    timeCosts.addingEdges += now() - start
  }

  // Use Delaunay triangulation to create edges
  T.start("Delaunay triangulation and edge creation")
  let start = now()
  const delaunay = Delaunay.from(pointsOfInterest.map((p) => [p.x, p.y]))
  timeCosts.delaunayConstruction = now() - start

  // Iterate through Delaunay edges
  for (let e = 0; e < delaunay.triangles.length; e++) {
    const p = delaunay.triangles[e]
    const q = delaunay.triangles[e % 3 === 2 ? e - 2 : e + 1]
    if (p < q) {
      // Ensures we don't add the same edge twice
      addEdgeToGraph(pointsOfInterest[p], pointsOfInterest[q])
    }
  }
  T.end()

  debug(timeCosts)

  return G
}
