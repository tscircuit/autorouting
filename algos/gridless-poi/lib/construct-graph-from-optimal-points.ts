import { Graph } from "@dagrejs/graphlib"
import type { LineObstacle, Point } from "../types"
import { getSegmentIntersection } from "./get-segment-intersection"

export const constructGraphFromOptimalPoints = (
  optimalPoints: Point[],
  obstacles: LineObstacle[],
): Graph => {
  // Construct a graph from every point that can reach every other point
  const G = new Graph({
    directed: false,
  })
  for (let i = 0; i < optimalPoints.length; i++) {
    G.setNode(i.toString(), { x: optimalPoints[i].x, y: optimalPoints[i].y })
  }
  const start = { x: -0.5, y: 0, color: "green", nodeName: "START" }
  const end = { x: 0.5, y: 0, color: "green", nodeName: "END" }
  G.setNode("START", { x: start.x, y: start.y })
  G.setNode("END", { x: end.x, y: end.y })

  function addEdgeToGraph(p1: Point, p2: Point) {
    let intersection
    for (const obstacle of obstacles) {
      const [op1, op2] = obstacle.linePoints
      intersection = getSegmentIntersection(
        p1.x,
        p1.y,
        p2.x,
        p2.y,
        op1.x,
        op1.y,
        op2.x,
        op2.y,
      )
      if (intersection) break
    }

    if (!intersection) {
      // add to graph that these nodes are connected
      const d = ((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2) ** 0.5
      G.setEdge(p1.nodeName!, p2.nodeName!, { d })
    }
  }

  for (let i = 0; i < optimalPoints.length; i++) {
    for (let u = i + 1; u < optimalPoints.length; u++) {
      const p1 = optimalPoints[i]
      const p2 = optimalPoints[u]
      addEdgeToGraph(p1, p2)
    }
    addEdgeToGraph(optimalPoints[i], start)
    addEdgeToGraph(optimalPoints[i], end)
  }
  return G
}
