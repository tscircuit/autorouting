import type { Point } from "@tscircuit/math-utils"
import type { PointWithLayer } from "solver-utils"
import {
  scale,
  fromTriangles,
  translate,
  compose,
  applyToPoint,
} from "transformation-matrix"

export const getPathComparisonSvg = (
  pathMap: Record<string, PointWithLayer[]>,
  obstacles?: Array<{
    center: { x: number; y: number }
    width: number
    height: number
  }>,
) => {
  const svgWidth = 640
  const svgHeight = 480

  // Find min and max coordinates
  let minX = Infinity,
    maxX = -Infinity,
    minY = Infinity,
    maxY = -Infinity
  Object.values(pathMap)
    .flat()
    .forEach((point) => {
      minX = Math.min(minX, point.x)
      maxX = Math.max(maxX, point.x)
      minY = Math.min(minY, point.y)
      maxY = Math.max(maxY, point.y)
    })

  // Compute scale and translation
  const padding = 20 // Padding around the edges

  // Define triangles in path coordinate space and SVG coordinate space
  const pathTriangle = [
    { x: minX, y: minY },
    { x: maxX, y: minY },
    { x: minX, y: maxY },
  ]
  const svgTriangle = [
    { x: padding, y: padding },
    { x: svgWidth - padding, y: padding },
    { x: padding, y: svgHeight - padding },
  ]

  // Compute the transform using fromTriangles
  const transform = fromTriangles(pathTriangle, svgTriangle)

  let svg = `<svg width="${svgWidth}" height="${svgHeight}" xmlns="http://www.w3.org/2000/svg">`

  const legendItems: string[] = []

  Object.entries(pathMap).forEach(([pathName, points], pathIndex) => {
    const color = `hsl(${pathIndex * 137.5}, 70%, 40%)`

    // Draw lines between adjacent points
    for (let i = 0; i < points.length - 1; i++) {
      const start = applyToPoint(transform, points[i])
      const end = applyToPoint(transform, points[i + 1])
      start.x -= 8 * pathIndex
      start.y -= 8 * pathIndex
      end.x -= 8 * pathIndex
      end.y -= 8 * pathIndex
      const isDashed =
        points[i].layer === "bottom" || points[i + 1].layer === "bottom"
      svg += `<line x1="${start.x}" y1="${start.y}" x2="${end.x}" y2="${end.y}" stroke="${color}" stroke-width="2" ${isDashed ? 'stroke-dasharray="4"' : ""} />`
    }

    // Draw points and add index numbers
    points.forEach((point, index) => {
      let { x, y } = applyToPoint(transform, point)
      x -= 8 * pathIndex
      y -= 8 * pathIndex

      svg += `<circle cx="${x}" cy="${y}" r="3" fill="${color}" />`
      svg += `<text x="${x + 5}" y="${y - 5}" font-size="10" fill="${color}">${index}</text>`
    })

    // Add legend item
    legendItems.push(
      `<text x="5" y="${15 * (pathIndex + 1)}" font-size="12" fill="${color}">${pathName}</text>`,
    )
  })

  // Draw obstacles if provided
  if (obstacles) {
    obstacles.forEach((obstacle) => {
      const { x, y } = applyToPoint(transform, obstacle.center)
      const halfWidth = obstacle.width / 2
      const halfHeight = obstacle.height / 2

      svg += `<rect 
          x="${x - halfWidth * transform.a}" 
          y="${y - halfHeight * transform.d}" 
          width="${obstacle.width * transform.a}" 
          height="${obstacle.height * transform.d}" 
          fill="rgba(255,0,0,0.2)" 
          stroke="red"
          stroke-width="1"
        />`
    })
  }

  // Add legend
  svg += `<g transform="translate(${svgWidth - 100}, ${svgHeight - 20 - legendItems.length * 15})">`
  svg += `<rect x="0" y="0" width="95" height="${legendItems.length * 15 + 10}" fill="white" opacity="0.7" />`
  svg += legendItems.join("")
  svg += "</g>"

  svg += "</svg>"
  return svg
}
