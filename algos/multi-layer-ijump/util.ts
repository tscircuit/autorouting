import type { Point3d, Direction3d } from "./types"

export function dirFromAToB(nodeA: Point3d, nodeB: Point3d): Direction3d {
  const dx = nodeB.x > nodeA.x ? 1 : nodeB.x < nodeA.x ? -1 : 0
  const dy = nodeB.y > nodeA.y ? 1 : nodeB.y < nodeA.y ? -1 : 0
  const dl = nodeB.l > nodeA.l ? 1 : nodeB.l < nodeA.l ? -1 : 0
  return { dx, dy, dl }
}

export function manDist(a: Point3d, b: Point3d): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y) + Math.abs(a.l - b.l)
}

export function getLayerIndex(layerCount: number, layer: string): number {
  if (layerCount === 1) return 0
  if (layerCount === 2) {
    if (layer === "top") return 0
    if (layer === "bottom") return 1
    throw new Error(
      `Invalid layer for getLayerIndex (for layerCount === 2): "${layer}"`,
    )
  }
  if (layerCount === 4) {
    const layerIndex = { top: 0, inner1: 1, inner2: 2, bottom: 3 }[layer]
    if (!layerIndex)
      throw new Error(
        `Invalid layer for getLayerIndex (for layerCount === 4): "${layer}"`,
      )
    return layerIndex
  }
  throw new Error(`Unsupported layer count for getLayerIndex: ${layerCount}`)
}

export function indexToLayer(layerCount: number, index: number): string {
  if (layerCount === 1) return "top"
  if (layerCount === 2) {
    if (index === 0) return "top"
    if (index === 1) return "bottom"
    throw new Error(
      `Bad index provided to indexToLayer: ${index} for layerCount: ${layerCount}`,
    )
  }
  if (layerCount === 4) {
    if (index === 0) return "top"
    if (index === 1) return "inner1"
    if (index === 2) return "inner2"
    if (index === 3) return "bottom"
    throw new Error(
      `Bad index provided to indexToLayer: ${index} for layerCount: ${layerCount}`,
    )
  }
  throw new Error(`Unsupported layer count for indexToLayer: ${layerCount}`)
}
