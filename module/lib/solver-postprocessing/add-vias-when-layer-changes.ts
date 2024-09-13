import type { SimplifiedPcbTrace } from "../types"

export type RouteItem = SimplifiedPcbTrace["route"][number]

export function addViasWhenLayerChanges(route: RouteItem[]): RouteItem[] {
  const newRoute: RouteItem[] = [route[0]]

  for (let i = 1; i < route.length - 1; i++) {
    const [prev, current, next] = [route[i - 1], route[i], route[i + 1]]

    newRoute.push(current)

    if (
      current.route_type !== "wire" ||
      prev.route_type !== "wire" ||
      next.route_type !== "wire"
    )
      continue

    if (prev.layer === current.layer && current.layer !== next.layer) {
      newRoute.push({
        route_type: "via",
        from_layer: current.layer,
        to_layer: next.layer,
        x: current.x,
        y: current.y,
      })
    }
  }
  newRoute.push(route[route.length - 1])

  return newRoute
}
