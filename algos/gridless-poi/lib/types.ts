export interface Point {
  x: number
  y: number
  color?: string
  cost?: number
  slope?: number
  nodeName?: string
}
export type LineObstacle = {
  obstacleType: "line"
  linePoints: Point[]
  width: number
}
