export class Profiler {
  private measurements: Record<
    string,
    {
      totalTime: number
      calls: number
      lastStart?: number
    }
  > = {}

  startMeasurement(name: string) {
    if (!this.measurements[name]) {
      this.measurements[name] = { totalTime: 0, calls: 0 }
    }
    this.measurements[name].lastStart = performance.now()
  }

  endMeasurement(name: string) {
    const measurement = this.measurements[name]
    if (!measurement || measurement.lastStart === undefined) return

    const duration = performance.now() - measurement.lastStart
    measurement.totalTime += duration
    measurement.calls += 1
    measurement.lastStart = undefined
  }

  wrapMethod<T extends any[], R>(
    name: string,
    fn: (...args: T) => R,
  ): (...args: T) => R {
    return (...args: T) => {
      this.startMeasurement(name)
      const result = fn(...args)
      this.endMeasurement(name)
      return result
    }
  }

  getResults() {
    const results: Record<
      string,
      {
        totalTime: number
        calls: number
        averageTime: number
      }
    > = {}

    for (const [name, data] of Object.entries(this.measurements)) {
      results[name] = {
        totalTime: data.totalTime,
        calls: data.calls,
        averageTime: data.totalTime / (data.calls || 1),
      }
    }

    return results
  }

  getResultsPretty(): Record<
    string,
    {
      totalTime: string
      calls: number
      averageTime: string
    }
  > {
    const results = this.getResults()
    const prettyResults: Record<
      string,
      {
        totalTime: string
        calls: number
        averageTime: string
      }
    > = {}
    for (const key in results) {
      prettyResults[key] = {
        totalTime: `${results[key].totalTime.toFixed(2)}ms`,
        calls: results[key].calls,
        averageTime: `${(results[key].averageTime * 1000).toFixed(1)}us`,
      }
    }
    return prettyResults
  }

  reset() {
    this.measurements = {}
  }
}
