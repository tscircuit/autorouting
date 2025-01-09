import type { PointWithLayer as Point } from "./GeneralizedAstar"

export function shortenPathWithShortcuts(
  route: Point[],
  checkIfObstacleBetweenPoints: (start: Point, end: Point) => boolean,
): Point[] {
  if (route.length <= 2) {
    return route
  }

  const shortened: Point[] = [route[0]]

  for (let i = 1; i < route.length; i++) {
    // can i extend this segment to a future segment?
    const currentSegment = {
      start: shortened[shortened.length - 1],
      end: route[i],
    }
    let skipToIndex = -1
    const currentSegmentIsVertical =
      currentSegment.start.x === currentSegment.end.x
    for (let j = i + 1; j < route.length; j++) {
      if (j <= skipToIndex) continue
      const futureSegment = {
        start: route[j],
        end: route[j + 1],
      }
      if (!futureSegment.end) continue
      const futureSegmentIsVertical =
        futureSegment.start.x === futureSegment.end.x

      const bothVertical = currentSegmentIsVertical === futureSegmentIsVertical
      const bothHorizontal =
        !currentSegmentIsVertical && !futureSegmentIsVertical

      const segmentsAreParallel = bothVertical || bothHorizontal

      if (!segmentsAreParallel) continue

      // "T" is the dimension if these lines are projected on their parallel axis

      let currentTStart = bothVertical
        ? currentSegment.start.y
        : currentSegment.start.x
      let currentTEnd = bothVertical
        ? currentSegment.end.y
        : currentSegment.end.x

      let futureTStart = bothVertical
        ? futureSegment.start.y
        : futureSegment.start.x
      let futureTEnd = bothVertical ? futureSegment.end.y : futureSegment.end.x

      const currentTMin = Math.min(currentTStart, currentTEnd)
      const currentTMax = Math.max(currentTStart, currentTEnd)
      const futureTMin = Math.min(futureTStart, futureTEnd)
      const futureTMax = Math.max(futureTStart, futureTEnd)

      const overlappingInT =
        currentTMin <= futureTMax && currentTMax >= futureTMin

      if (!overlappingInT) continue

      const otherDim = bothVertical
        ? currentSegment.start.x
        : currentSegment.start.y
      const futureOtherDim = bothVertical
        ? futureSegment.start.x
        : futureSegment.start.y

      let shortcutPoint: Point

      if (futureTMax >= currentTMin && futureTMax <= currentTMax) {
        // Shortcut type 1
        shortcutPoint = {
          x: bothVertical ? otherDim : futureTMax,
          y: bothVertical ? futureTMin : otherDim,
          layer: currentSegment.end.layer,
        }
      } else if (futureTMin >= currentTMin && futureTMin <= currentTMax) {
        // Shortcut type 2
        shortcutPoint = {
          x: bothVertical ? otherDim : futureTMin,
          y: bothVertical ? futureTMax : otherDim,
          layer: currentSegment.end.layer,
        }
      } else {
        // Shortcut type 3, ignore for now
        continue
      }
      const pointAfterShortcut = route[j + 2]
      if (!pointAfterShortcut) continue

      if (
        checkIfObstacleBetweenPoints(
          shortened[shortened.length - 1],
          shortcutPoint,
        ) ||
        checkIfObstacleBetweenPoints(shortcutPoint, pointAfterShortcut)
      ) {
        console.log("obstacle in between")
        continue
      }

      shortened.push(shortcutPoint)
      i = j + 1
      skipToIndex = j + 1
      break
    }

    if (skipToIndex === -1) {
      shortened.push(route[i])
    }
  }

  if (shortened[shortened.length - 1] !== route[route.length - 1]) {
    shortened.push(route[route.length - 1])
  }

  return shortened
}
