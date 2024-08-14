export const builtinSolvers: any = {
  "simple-grid": async () =>
    (await import("../../../algos/simple-grid/index")).autoroute,
  "gridless-poi": async () =>
    (await import("../../../algos/gridless-poi/index")).autoroute,
  "infgrid-astar": async () =>
    (await import("../../../algos/infinite-grid-astar/index")).autoroute,
  "infgrid-ijump-astar": async () =>
    (await import("../../../algos/infinite-grid-ijump-astar/index")).autoroute,
  "jump-point-grid": async () =>
    (await import("../../../algos/jump-point-grid/index")).autoroute,
}
export const getBuiltinAvailableSolver = async (solverName: string) => {
  return builtinSolvers[solverName]()
}
