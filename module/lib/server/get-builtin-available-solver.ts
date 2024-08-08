const builtinSolvers: any = {
  "simple-grid-based": async () =>
    (await import("../../../algos/simple-grid-based/index")).autoroute,
  "gridless-poi": async () =>
    (await import("../../../algos/gridless-poi/index")).autoroute,
}
export const getBuiltinAvailableSolver = async (solverName: string) => {
  return builtinSolvers[solverName]()
}
