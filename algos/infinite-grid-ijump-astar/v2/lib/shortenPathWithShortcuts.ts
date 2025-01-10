import { current } from "circuit-json"
import type { PointWithLayer as Point } from "./GeneralizedAstar"
import Debug from "debug"

const debug = Debug("autorouter:shortenPathWithShortcuts")

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
    const currentSegmentIsHorizontal =
      currentSegment.start.y === currentSegment.end.y
    for (let j = i + 1; j < route.length; j++) {
      if (j <= skipToIndex) continue
      const futureSegment = {
        start: route[j],
        end: route[j + 1],
      }
      if (!futureSegment.end) continue
      const futureSegmentIsVertical =
        futureSegment.start.x === futureSegment.end.x
      const futureSegmentIsHorizontal =
        futureSegment.start.y === futureSegment.end.y

      const bothVertical = currentSegmentIsVertical && futureSegmentIsVertical
      const bothHorizontal =
        currentSegmentIsHorizontal && futureSegmentIsHorizontal

      if (bothHorizontal && bothVertical) continue
      const segmentsAreParallel = bothVertical || bothHorizontal

      if (!segmentsAreParallel) continue

      let overlapping = false

      const currentMinX = Math.min(currentSegment.start.x, currentSegment.end.x)
      const currentMaxX = Math.max(currentSegment.start.x, currentSegment.end.x)
      const futureMinX = Math.min(futureSegment.start.x, futureSegment.end.x)
      const futureMaxX = Math.max(futureSegment.start.x, futureSegment.end.x)

      const currentMinY = Math.min(currentSegment.start.y, currentSegment.end.y)
      const currentMaxY = Math.max(currentSegment.start.y, currentSegment.end.y)
      const futureMinY = Math.min(futureSegment.start.y, futureSegment.end.y)
      const futureMaxY = Math.max(futureSegment.start.y, futureSegment.end.y)

      if (bothHorizontal) {
        overlapping = currentMinX <= futureMaxX && currentMaxX >= futureMinX
      } else if (bothVertical) {
        overlapping = currentMinY <= futureMaxY && currentMaxY >= futureMinY
      }

      // "T" is the dimension if these lines are projected on their parallel axis

      // let currentTStart = bothVertical
      //   ? currentSegment.start.y
      //   : currentSegment.start.x
      // let currentTEnd = bothVertical
      //   ? currentSegment.end.y
      //   : currentSegment.end.x

      // let futureTStart = bothVertical
      //   ? futureSegment.start.y
      //   : futureSegment.start.x
      // let futureTEnd = bothVertical ? futureSegment.end.y : futureSegment.end.x

      // const currentTMin = Math.min(currentTStart, currentTEnd)
      // const currentTMax = Math.max(currentTStart, currentTEnd)
      // const futureTMin = Math.min(futureTStart, futureTEnd)
      // const futureTMax = Math.max(futureTStart, futureTEnd)

      // const overlappingInT =
      //   currentTMin <= futureTMax && currentTMax >= futureTMin

      if (!overlapping) continue

      const candidateShortcuts: Point[] = []

      if (bothHorizontal && futureMinX < currentMaxX) {
        console.log("case 1")
        candidateShortcuts.push({
          x: futureMinX,
          y: currentSegment.start.y,
          layer: currentSegment.start.layer,
        })
      }
      if (bothHorizontal && futureMaxX > currentMinX) {
        console.log("case 2")
        candidateShortcuts.push({
          x: futureMaxX,
          y: currentSegment.start.y,
          layer: currentSegment.start.layer,
        })
      }
      if (bothVertical && futureMinY < currentMaxY) {
        console.log("case 3")
        candidateShortcuts.push({
          x: currentSegment.start.x,
          y: futureMinY,
          layer: currentSegment.start.layer,
        })
      }
      if (bothVertical && futureMaxY > currentMinY) {
        console.log("case 4")
        candidateShortcuts.push({
          x: currentSegment.start.x,
          y: futureMaxY,
          layer: currentSegment.start.layer,
        })
      }

      const pointBeforeShortcut = shortened[shortened.length - 1]
      const pointAfterShortcut = route[j + 2]
      if (!pointAfterShortcut) continue

      console.table([
        pointBeforeShortcut,
        {},
        ...candidateShortcuts,
        {},
        pointAfterShortcut,
      ])

      let shortcutPoint: Point | null = null

      console.log({
        shortened,
        pointBeforeShortcut,
        candidateShortcuts,
        pointAfterShortcut,
      })

      for (const candidateShortcut of candidateShortcuts) {
        if (
          checkIfObstacleBetweenPoints(
            pointBeforeShortcut,
            candidateShortcut,
          ) ||
          checkIfObstacleBetweenPoints(pointAfterShortcut, candidateShortcut)
        ) {
          continue
        }

        shortcutPoint = candidateShortcut
        break
      }

      if (!shortcutPoint) continue

      console.log("success", shortcutPoint)
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
