import { GeneralizedAstarAutorouter } from "algos/common/generalized-astar/GeneralizedAstarAutorouter"
import { ObstacleList } from "algos/common/generalized-astar/ObstacleList"
import type {
  PointWithObstacleHit,
  Node,
} from "algos/common/generalized-astar/types"
import type { Obstacle } from "solver-utils"
import type { SimpleRouteConnection } from "solver-utils/SimpleRouteJson"

/**
 * seveibar1 is a variation of the multi-layer ijump autorouter that uses more
 * efficient memory access and tries to avoid some slow paths in the original
 * multi-layer autorouter.
 *
 * This is created by profiling the operations of each of the major components
 * of the original MultilayerIjump autorouter and optimizing each component
 * independently.
 *
 * There are three main time-consuming components of the autorouter:
 * - GeneralizedAstarAutorouter (the base class that determines what point
 *   is highest in the priority queue)
 * - ObstacleList
 * - getNeighbors
 */
export class Seveibar1 extends GeneralizedAstarAutorouter {}
