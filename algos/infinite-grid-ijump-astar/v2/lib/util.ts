import type { Point } from "./types"

export const clamp = (min: number, max: number, value: number) => {
  return Math.min(Math.max(min, value), max)
}

export const manDist = (a: Point, b: Point): number => {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y)
}

export const dist = (a: Point, b: Point): number => {
  return ((a.x - b.x) ** 2 + (a.y - b.y) ** 2) ** 0.5
}

export const dirFromAToB = (a: Point, b: Point): { x: number; y: number } => {
  return {
    x: Math.sign(b.x - a.x),
    y: Math.sign(b.y - a.y),
  }
}

export const nodeName = (node: Point, GRID_STEP: number = 0.1): string =>
  `${Math.round(node.x / GRID_STEP)},${Math.round(node.y / GRID_STEP)}`
