import { getSingleTraceGenerator } from "./single-trace"

export const getDatasetGenerator = (problemType: "single-trace") => {
  return getSingleTraceGenerator()
}
