const problemTypes = [
  "single-trace",
  "single-multi-point-trace",
  "traces",
  "layers-traces",
  "traces-groups",
  "layers-traces-groups",
]

export const DatasetNavigation = () => {
  const [, , selectedProblemType, seedStr] = window.location.pathname.split("/")
  const seed = seedStr ? Number.parseInt(seedStr) : 0
  const userMessage = window.USER_MESSAGE ?? ""

  return (
    <div>
      {userMessage && <div style={{ color: "red" }}>{userMessage}</div>}
      {selectedProblemType && (
        <>
          <h2>
            {selectedProblemType} - {seed}
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
      <h2>Select a problem to view below</h2>
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
