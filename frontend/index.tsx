import { ContextProviders } from "./components/ContextProviders"
import ViewProblemAndSolution from "./components/ViewProblemAndSolution"

export default () => {
  return (
    <ContextProviders>
      <ViewProblemAndSolution />
    </ContextProviders>
  )
}
