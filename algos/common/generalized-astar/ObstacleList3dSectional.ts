import type { Obstacle, ObstacleWithEdges } from "solver-utils"
import { ObstacleList3d } from "./ObstacleList3d"
import type {
  Direction3d,
  DirectionDistances,
  DirectionDistances3d,
  DirectionWithCollisionInfo3d,
  Obstacle3d,
  ObstacleWithEdges3d,
  Point3d,
} from "./types"
import { Profiler } from "./Profiler"

type SectionId = `${number},${number}`

const globalObstacleList3dSectionalProfiler = new Profiler()

export class ObstacleList3dSectional implements ObstacleList3d {
  /**
   * Contains obstacles that are touching or in any way interacting with a small
   * section
   */
  sections: Record<SectionId, ObstacleList3d> = {}

  /**
   * Contains obstacles that are aligned to a section, i.e. they lie directly
   * above, below, to the left, or to the right of a section (including the
   * section). This is used to do ray intersections
   */
  alignedSections: Record<SectionId, ObstacleList3d> = {}
  profiler?: Profiler | undefined
  obstacles = []
  bounds: { minX: number; minY: number; maxX: number; maxY: number }
  GRID_STEP: number = 0.1

  sectionSizeX: number
  sectionSizeY: number
  numSectionsX: number
  numSectionsY: number

  layerCount: number

  constructor(layerCount: number, obstacles: Array<Obstacle>) {
    if (process.env.TSCIRCUIT_AUTOROUTER_PROFILING_ENABLED) {
      this.profiler = globalObstacleList3dSectionalProfiler
    }
    this.layerCount = layerCount

    this.bounds = {
      minX: Infinity,
      minY: Infinity,
      maxX: -Infinity,
      maxY: -Infinity,
    }

    for (const obstacle of obstacles) {
      this.bounds.minX = Math.min(
        this.bounds.minX,
        obstacle.center.x - obstacle.width / 2,
      )
      this.bounds.minY = Math.min(
        this.bounds.minY,
        obstacle.center.y - obstacle.height / 2,
      )
      this.bounds.maxX = Math.max(
        this.bounds.maxX,
        obstacle.center.x + obstacle.width / 2,
      )
      this.bounds.maxY = Math.max(
        this.bounds.maxY,
        obstacle.center.y + obstacle.height / 2,
      )
    }

    this.numSectionsX = 10
    this.numSectionsY = 10

    this.sectionSizeX =
      (this.bounds.maxX - this.bounds.minX) / this.numSectionsX
    this.sectionSizeY =
      (this.bounds.maxY - this.bounds.minY) / this.numSectionsY

    const obstaclesInSection: Record<SectionId, Array<Obstacle>> = {}
    const obstaclesInAlignedSection: Record<SectionId, Array<Obstacle>> = {}
    for (let sectionX = 0; sectionX < this.numSectionsX; sectionX++) {
      for (let sectionY = 0; sectionY < this.numSectionsY; sectionY++) {
        obstaclesInSection[`${sectionX},${sectionY}`] = []
        obstaclesInAlignedSection[`${sectionX},${sectionY}`] = []
      }
    }

    for (const obstacle of obstacles) {
      const sections = this._getSectionsOfObstacle(obstacle)
      for (const section of sections) {
        obstaclesInSection[section].push(obstacle)
      }

      const alignedSections = this._getAlignedSectionsForObstacle(obstacle)
      for (const section of alignedSections) {
        obstaclesInAlignedSection[section].push(obstacle)
      }
    }

    this.sections = {}
    for (const sectionId of Object.keys(obstaclesInSection)) {
      const typedSectionId = sectionId as `${number},${number}`
      this.sections[typedSectionId] = new ObstacleList3d(
        layerCount,
        obstaclesInSection[typedSectionId],
      )
    }

    this.alignedSections = {}
    for (const sectionId of Object.keys(obstaclesInAlignedSection)) {
      const typedSectionId = sectionId as `${number},${number}`
      this.alignedSections[typedSectionId] = new ObstacleList3d(
        layerCount,
        obstaclesInAlignedSection[typedSectionId],
      )
    }

    if (this.profiler) {
      for (const methodName of [
        "getObstacleAt",
        "isObstacleAt",
        "getDirectionDistancesToNearestObstacle",
        "getOrthoDirectionCollisionInfo",
        "getObstaclesOverlappingRegion",
      ]) {
        // @ts-ignore
        const originalMethod = this[methodName] as Function
        // @ts-ignore
        this[methodName as keyof ObstacleList] = this.profiler!.wrapMethod(
          `ObstacleList3dSectional.${methodName}`,
          originalMethod.bind(this),
        )
      }
    }
  }

  _getSectionXYForPoint(x: number, y: number): [number, number] {
    let sectionX = Math.floor((x - this.bounds.minX) / this.sectionSizeX)
    let sectionY = Math.floor((y - this.bounds.minY) / this.sectionSizeY)
    // clamp
    sectionX = Math.max(0, Math.min(this.numSectionsX - 1, sectionX))
    sectionY = Math.max(0, Math.min(this.numSectionsY - 1, sectionY))

    return [sectionX, sectionY]
  }

  _getSectionForPoint(x: number, y: number): SectionId {
    const [sectionX, sectionY] = this._getSectionXYForPoint(x, y)
    return `${sectionX},${sectionY}`
  }

  _getSectionsOfRegion(region: {
    minX: number
    minY: number
    maxX: number
    maxY: number
  }) {
    const [minSectionX, minSectionY] = this._getSectionXYForPoint(
      region.minX,
      region.minY,
    )
    const [maxSectionX, maxSectionY] = this._getSectionXYForPoint(
      region.maxX,
      region.maxY,
    )

    const sections: SectionId[] = []
    for (let sectionX = minSectionX; sectionX <= maxSectionX; sectionX++) {
      for (let sectionY = minSectionY; sectionY <= maxSectionY; sectionY++) {
        sections.push(`${sectionX},${sectionY}`)
      }
    }

    return sections
  }

  _getSectionsOfObstacle(obstacle: Obstacle): SectionId[] {
    const {
      center: { x, y },
      height,
      width,
    } = obstacle
    return this._getSectionsOfRegion({
      minX: x - width / 2,
      minY: y - height / 2,
      maxX: x + width / 2,
      maxY: y + height / 2,
    })
  }

  _getAlignedSectionsForObstacle(obstacle: Obstacle): SectionId[] {
    const {
      center: { x, y },
      height,
      width,
    } = obstacle
    const alignedSections: Set<SectionId> = new Set()

    const [minSectionX, minSectionY] = this._getSectionXYForPoint(
      x - width / 2,
      y - height / 2,
    )
    const [maxSectionX, maxSectionY] = this._getSectionXYForPoint(
      x + width / 2,
      y + height / 2,
    )

    for (let sectionX = minSectionX; sectionX <= maxSectionX; sectionX++) {
      // Add all sections above and below
      for (let sectionY = 0; sectionY < this.numSectionsY; sectionY++) {
        alignedSections.add(`${sectionX},${sectionY}`)
      }
    }

    for (let sectionY = minSectionY; sectionY <= maxSectionY; sectionY++) {
      // Add all sections to the left and right
      for (let sectionX = 0; sectionX < this.numSectionsX; sectionX++) {
        alignedSections.add(`${sectionX},${sectionY}`)
      }
    }

    return Array.from(alignedSections)
  }

  getObstacleAt(x: number, y: number, l: number, m?: number): Obstacle | null {
    const sectionId = this._getSectionForPoint(x, y)
    return this.sections[sectionId]?.getObstacleAt(x, y, l, m) ?? null
  }

  isObstacleAt(x: number, y: number, l: number, m?: number): boolean {
    const sectionId = this._getSectionForPoint(x, y)
    return this.sections[sectionId]?.isObstacleAt(x, y, l, m) ?? false
  }

  getDirectionDistancesToNearestObstacle3d(
    x: number,
    y: number,
    l: number,
  ): DirectionDistances3d {
    const sectionId = this._getSectionForPoint(x, y)
    return this.alignedSections[
      sectionId
    ].getDirectionDistancesToNearestObstacle3d(x, y, l)
  }
  getOrthoDirectionCollisionInfo(
    point: Point3d,
    dir: Direction3d,
    opts?: { margin?: number },
  ): DirectionWithCollisionInfo3d {
    const sectionId = this._getSectionForPoint(point.x, point.y)
    return this.alignedSections[sectionId].getOrthoDirectionCollisionInfo(
      point,
      dir,
      opts,
    )
  }
  getObstaclesOverlappingRegion(region: {
    minX: number
    minY: number
    maxX: number
    maxY: number
    l: number
  }): ObstacleWithEdges[] {
    const sections = this._getSectionsOfRegion(region)

    const obstacles: ObstacleWithEdges[] = []
    for (const section of sections) {
      obstacles.push(
        ...this.sections[section].getObstaclesOverlappingRegion(region),
      )
    }

    // TODO dedupe obstacles

    return obstacles
  }

  getDirectionDistancesToNearestObstacle(
    x: number,
    y: number,
  ): DirectionDistances {
    const sectionId = this._getSectionForPoint(x, y)
    return this.alignedSections[
      sectionId
    ].getDirectionDistancesToNearestObstacle(x, y)
  }
}
