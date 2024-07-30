export const DatasetNavigation = () => {
  const problemTypes = window.AVAILABLE_DATASETS ?? ["single-trace"]
  const [, , selectedProblemType, seedStr] = window.location.pathname.split("/")
  const seed = seedStr ? Number.parseInt(seedStr) : 0
  const userMessage = window.USER_MESSAGE ?? ""

  return (
    <div>
      {userMessage && (
        <div style={{ color: "red", whiteSpace: "pre-wrap" }}>
          {userMessage}
        </div>
      )}
      {selectedProblemType && (
        <>
          <h2>
            {selectedProblemType} -{" "}
            <a href={`/problem/${selectedProblemType}/${seed}.json`}>#{seed}</a>{" "}
            <a href={`/problem/${selectedProblemType}/${seed}.json`}>
              download (json)
            </a>
          </h2>
          <div>
            <button
              disabled={seed === 0}
              onClick={() => {
                window.location.href = `/problem/${selectedProblemType}/${seed - 1}`
              }}
            >
              Prev
            </button>
            <button
              onClick={() => {
                window.location.href = `/problem/${selectedProblemType}/${seed + 1}`
              }}
            >
              Next
            </button>
          </div>
        </>
      )}
      <h2 style={{ marginBottom: 0 }}>Select a problem to view below</h2>
      <a
        style={{ marginBottom: 8, display: "block" }}
        href="https://github.com/tscircuit/autorouting-dataset#problems"
      >
        View problem dataset descriptions
      </a>
      <div>
        {problemTypes.map((problemType) => (
          <button
            type="button"
            disabled={problemType === selectedProblemType}
            key={problemType}
            style={{ margin: 2 }}
            onClick={() => {
              window.location.href = `/problem/${problemType}/1`
            }}
          >
            {problemType}
          </button>
        ))}
      </div>
    </div>
  )
}
