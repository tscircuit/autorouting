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
import { ObstacleList3dF64V2 } from "./ObstacleList3dF64V2"

type SectionId = `${number},${number}`

const globalObstacleList3dSectionalV2Profiler = new Profiler()

export class ObstacleList3dSectionalV2 implements ObstacleList3d {
  /**
   * Cached on-demand computed sections.
   * Each section caches an ObstacleList3d containing obstacles intersecting that section.
   */
  private sectionsCache: Record<SectionId, ObstacleList3d> = {}

  /**
   * Cached on-demand computed aligned sections.
   * Each aligned section caches an ObstacleList3d containing obstacles aligned with that section.
   */
  private alignedSectionsCache: Record<SectionId, ObstacleList3d> = {}

  profiler?: Profiler | undefined
  obstacles: Obstacle[]
  bounds: { minX: number; minY: number; maxX: number; maxY: number }
  GRID_STEP: number = 0.1

  sectionSizeX: number
  sectionSizeY: number
  numSectionsX: number
  numSectionsY: number

  layerCount: number

  constructor(layerCount: number, obstacles: Array<Obstacle>) {
    if (process.env.TSCIRCUIT_AUTOROUTER_PROFILING_ENABLED) {
      this.profiler = globalObstacleList3dSectionalV2Profiler
    }
    this.layerCount = layerCount
    this.obstacles = obstacles

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

    // We choose a fixed number of sections for demonstration.
    // This can be dynamic or configurable if needed.
    this.numSectionsX = 10
    this.numSectionsY = 10

    this.sectionSizeX =
      (this.bounds.maxX - this.bounds.minX) / this.numSectionsX
    this.sectionSizeY =
      (this.bounds.maxY - this.bounds.minY) / this.numSectionsY

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
        this[methodName as keyof ObstacleList3d] = this.profiler!.wrapMethod(
          `ObstacleList3dSectional.${methodName}`,
          originalMethod.bind(this),
        )
      }
    }
  }

  /**
   * Compute sections that intersect with a given region.
   */
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

    // Vertical alignment (above/below): all sections with x between minSectionX and maxSectionX.
    for (let sectionX = minSectionX; sectionX <= maxSectionX; sectionX++) {
      for (let sectionY = 0; sectionY < this.numSectionsY; sectionY++) {
        alignedSections.add(`${sectionX},${sectionY}`)
      }
    }

    // Horizontal alignment (left/right): all sections with y between minSectionY and maxSectionY.
    for (let sectionY = minSectionY; sectionY <= maxSectionY; sectionY++) {
      for (let sectionX = 0; sectionX < this.numSectionsX; sectionX++) {
        alignedSections.add(`${sectionX},${sectionY}`)
      }
    }

    return Array.from(alignedSections)
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

  /**
   * Lazily compute and cache the ObstacleList3d for a given section.
   */
  private _getSectionObstacleList(sectionId: SectionId): ObstacleList3d {
    if (!this.sectionsCache[sectionId]) {
      // Compute obstacles in this section
      const [sectionXStr, sectionYStr] = sectionId.split(",")
      const sectionX = parseInt(sectionXStr, 10)
      const sectionY = parseInt(sectionYStr, 10)

      const sectionMinX = this.bounds.minX + sectionX * this.sectionSizeX
      const sectionMinY = this.bounds.minY + sectionY * this.sectionSizeY
      const sectionMaxX = sectionMinX + this.sectionSizeX
      const sectionMaxY = sectionMinY + this.sectionSizeY

      const obstaclesInSection = this.obstacles.filter((obstacle) => {
        const oxMin = obstacle.center.x - obstacle.width / 2
        const oxMax = obstacle.center.x + obstacle.width / 2
        const oyMin = obstacle.center.y - obstacle.height / 2
        const oyMax = obstacle.center.y + obstacle.height / 2

        // Check if obstacle intersects with the section region
        return (
          oxMax >= sectionMinX &&
          oxMin <= sectionMaxX &&
          oyMax >= sectionMinY &&
          oyMin <= sectionMaxY
        )
      })

      this.sectionsCache[sectionId] = new ObstacleList3dF64V2(
        this.layerCount,
        obstaclesInSection,
      )
    }
    return this.sectionsCache[sectionId]
  }

  /**
   * Lazily compute and cache the ObstacleList3d for a given aligned section.
   */
  private _getAlignedSectionObstacleList(sectionId: SectionId): ObstacleList3d {
    if (!this.alignedSectionsCache[sectionId]) {
      // Compute obstacles aligned with this section
      const [sectionXStr, sectionYStr] = sectionId.split(",")
      const sectionX = parseInt(sectionXStr, 10)
      const sectionY = parseInt(sectionYStr, 10)

      // Find all obstacles that would appear in the alignedSections of this section.
      // Aligned sections contain all obstacles that share x or y alignment.
      // In other words, if the obstacle spans horizontally above, below,
      // or vertically to the left/right of this section, it's included.

      // To find aligned obstacles, we basically consider:
      // - All obstacles that would intersect at least one section with the same sectionX (vertically aligned).
      // - All obstacles that would intersect at least one section with the same sectionY (horizontally aligned).

      const obstaclesInAlignedSection = this.obstacles.filter((obstacle) => {
        const obstacleSections = this._getSectionsOfObstacle(obstacle)

        // If the obstacle intersects any section with the same X index or
        // any section with the same Y index, it's aligned.
        return obstacleSections.some((sid) => {
          const [oxStr, oyStr] = sid.split(",")
          const ox = parseInt(oxStr, 10)
          const oy = parseInt(oyStr, 10)
          return ox === sectionX || oy === sectionY
        })
      })

      this.alignedSectionsCache[sectionId] = new ObstacleList3dF64V2(
        this.layerCount,
        obstaclesInAlignedSection,
      )
    }
    return this.alignedSectionsCache[sectionId]
  }

  getObstacleAt(x: number, y: number, l: number, m?: number): Obstacle | null {
    const sectionId = this._getSectionForPoint(x, y)
    return (
      this._getSectionObstacleList(sectionId)?.getObstacleAt(x, y, l, m) ?? null
    )
  }

  isObstacleAt(x: number, y: number, l: number, m?: number): boolean {
    const sectionId = this._getSectionForPoint(x, y)
    return (
      this._getSectionObstacleList(sectionId)?.isObstacleAt(x, y, l, m) ?? false
    )
  }

  getDirectionDistancesToNearestObstacle3d(
    x: number,
    y: number,
    l: number,
  ): DirectionDistances3d {
    const sectionId = this._getSectionForPoint(x, y)
    return this._getAlignedSectionObstacleList(
      sectionId,
    ).getDirectionDistancesToNearestObstacle3d(x, y, l)
  }

  getOrthoDirectionCollisionInfo(
    point: Point3d,
    dir: Direction3d,
    opts?: { margin?: number },
  ): DirectionWithCollisionInfo3d {
    const sectionId = this._getSectionForPoint(point.x, point.y)
    return this._getAlignedSectionObstacleList(
      sectionId,
    ).getOrthoDirectionCollisionInfo(point, dir, opts)
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
        ...this._getSectionObstacleList(section).getObstaclesOverlappingRegion(
          region,
        ),
      )
    }

    // TODO: Deduplicate obstacles if necessary.
    return obstacles
  }

  getDirectionDistancesToNearestObstacle(
    x: number,
    y: number,
  ): DirectionDistances {
    const sectionId = this._getSectionForPoint(x, y)
    return this._getAlignedSectionObstacleList(
      sectionId,
    ).getDirectionDistancesToNearestObstacle(x, y)
  }
}
