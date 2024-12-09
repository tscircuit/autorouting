export const builtinSolvers: any = {
  "multilayer-ijump": async () =>
    (await import("../../../algos/multi-layer-ijump/index")).autoroute,
  "simple-grid": async () =>
    (await import("../../../algos/simple-grid/index")).autoroute,
  "gridless-poi": async () =>
    (await import("../../../algos/gridless-poi/index")).autoroute,
  "infgrid-astar": async () =>
    (await import("../../../algos/infinite-grid-astar/index")).autoroute,
  "infgrid-ijump-astar": async () =>
    (await import("../../../algos/infinite-grid-ijump-astar/v2")).autoroute,
  "infgrid-ijump-astar-multimargin": async () =>
    (await import("../../../algos/infinite-grid-ijump-astar/v2"))
      .autorouteMultiMargin,
  "jump-point-grid": async () =>
    (await import("../../../algos/jump-point-grid/index")).autoroute,
}
export const getBuiltinAvailableSolver = async (solverName: string) => {
  return builtinSolvers[solverName]()
}
