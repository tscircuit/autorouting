export const DatasetNavigation = () => {
  const problemTypes = window.AVAILABLE_DATASETS ?? ["single-trace"]
  const [, , selectedProblemType, seedStr, solverName] =
    window.location.pathname.split("/")
  const seed = seedStr ? Number.parseInt(seedStr) : 0
  const userMessage = window.USER_MESSAGE ?? ""

  const solverDownloadSuffix = solverName
    ? `/${solverName}/problem.json`
    : ".problem.json"
  const solverSuffix = solverName ? `/${solverName}` : ""

  return (
    <div>
      {userMessage && (
        <div style={{ color: "red", whiteSpace: "pre-wrap" }}>
          {userMessage}
        </div>
      )}
      <h2 style={{ display: "flex", alignItems: "center" }}>
        <span>Select a dataset to view below</span>
        <a
          style={{ fontSize: 14, marginLeft: 12 }}
          href="https://github.com/tscircuit/autorouting-dataset#problems"
        >
          view dataset descriptions
        </a>
      </h2>
      <div style={{ display: "flex", gap: 2 }}>
        {problemTypes.map((problemType) => (
          <button
            type="button"
            disabled={problemType === selectedProblemType}
            key={problemType}
            style={{ margin: 2 }}
            onClick={() => {
              window.location.href = `/problem/${problemType}/1${solverSuffix}`
            }}
          >
            {problemType}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <select
          value={window.SOLVER_NAME}
          disabled={
            !window.AVAILABLE_SOLVERS || window.AVAILABLE_SOLVERS.length <= 1
          }
          onChange={(e) => {
            window.location.href = `/problem/${selectedProblemType}/${seedStr}/${e.target.value}`
          }}
        >
          {(window.AVAILABLE_SOLVERS || [window.SOLVER_NAME]).map(
            (solverName) => (
              <option value={solverName} key={solverName}>
                {solverName}
              </option>
            ),
          )}
        </select>
      </div>
      {selectedProblemType && (
        <>
          <h2>
            {selectedProblemType} -{" "}
            <a
              href={`/problem/${selectedProblemType}/${seed}${solverDownloadSuffix}`}
            >
              #{seed}
            </a>{" "}
            <a
              href={`/problem/${selectedProblemType}/${seed}${solverDownloadSuffix}`}
            >
              download (json)
            </a>
          </h2>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              disabled={seed === 0}
              onClick={() => {
                window.location.href = `/problem/${selectedProblemType}/${seed - 1}${solverSuffix}`
              }}
            >
              Prev Sample
            </button>
            <button
              onClick={() => {
                window.location.href = `/problem/${selectedProblemType}/${seed + 1}${solverSuffix}`
              }}
            >
              Next Sample
            </button>
          </div>
        </>
      )}
    </div>
  )
}
