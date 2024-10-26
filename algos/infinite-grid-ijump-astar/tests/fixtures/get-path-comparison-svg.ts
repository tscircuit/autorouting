import type { Point } from "@tscircuit/math-utils"
import {
  scale,
  fromTriangles,
  translate,
  compose,
  applyToPoint,
} from "transformation-matrix"

export const getPathComparisonSvg = (pathMap: Record<string, Point[]>) => {
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
      svg += `<line x1="${start.x}" y1="${start.y}" x2="${end.x}" y2="${end.y}" stroke="${color}" stroke-width="2" />`
    }

    // Draw points and add index numbers
    points.forEach((point, index) => {
      const { x, y } = applyToPoint(transform, point)
      svg += `<circle cx="${x}" cy="${y}" r="3" fill="${color}" />`
      svg += `<text x="${x + 5}" y="${y - 5 + pathIndex * 14}" font-size="10" fill="${color}">${index}</text>`
    })

    // Add legend item
    legendItems.push(
      `<text x="5" y="${15 * (pathIndex + 1)}" font-size="12" fill="${color}">${pathName}</text>`,
    )
  })

  // Add legend
  svg += `<g transform="translate(${svgWidth - 100}, ${svgHeight - 20 - legendItems.length * 15})">`
  svg += `<rect x="0" y="0" width="95" height="${legendItems.length * 15 + 10}" fill="white" opacity="0.7" />`
  svg += legendItems.join("")
  svg += "</g>"

  svg += "</svg>"
  return svg
}
