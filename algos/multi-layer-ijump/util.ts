import type { LayerRef } from "circuit-json"
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

export const LAYER_COUNT_INDEX_MAP: Record<number, string[]> = {
  1: ["top"],
  2: ["top", "bottom"],
  4: ["top", "inner1", "inner2", "bottom"],
}

export const getLayerNamesForLayerCount = (layerCount: number): string[] => {
  return LAYER_COUNT_INDEX_MAP[layerCount]
}

export function getLayerIndex(layerCount: number, layer: string): number {
  const layerArray = LAYER_COUNT_INDEX_MAP[layerCount]
  const index = layerArray.indexOf(layer)
  if (index === -1) {
    throw new Error(
      `Invalid layer for getLayerIndex (for layerCount === ${layerCount}): "${layer}"`,
    )
  }
  return index
}

export function indexToLayer(layerCount: number, index: number): string {
  const layerArray = LAYER_COUNT_INDEX_MAP[layerCount]
  const layer = layerArray[index]
  if (!layer) {
    throw new Error(
      `Invalid index for indexToLayer (for layerCount === ${layerCount}): "${index}"`,
    )
  }
  return layer
}
