import now from "performance-now"

interface TimerEntry {
  label: string
  start: number
  end?: number
}

export class Timer {
  private timers: Map<string, TimerEntry[]> = new Map()
  private activeTimers: TimerEntry[] = []
  private logOnEnd: boolean

  constructor(options: { logOnEnd?: boolean } = {}) {
    this.logOnEnd = options.logOnEnd || false
  }

  start(label: string): void {
    const entry: TimerEntry = {
      label,
      start: now(),
    }
    this.activeTimers.push(entry)

    if (!this.timers.has(label)) {
      this.timers.set(label, [])
    }
    this.timers.get(label)!.push(entry)
  }

  end(label?: string): void {
    if (this.activeTimers.length === 0) {
      return
    }

    const endTime = now()
    let timerToEnd: TimerEntry

    if (label) {
      const index = this.activeTimers.findLastIndex(
        (timer) => timer.label === label,
      )
      if (index === -1) {
        console.warn(`Timer "${label}" was never started`)
        return
      }
      timerToEnd = this.activeTimers[index]
      this.activeTimers.splice(index, 1)
    } else {
      timerToEnd = this.activeTimers.pop()!
    }

    timerToEnd.end = endTime
    const duration = timerToEnd.end - timerToEnd.start

    if (this.logOnEnd) {
      console.log(`${timerToEnd.label}: ${duration.toFixed(3)}ms`)
    }
  }

  logAll(): void {
    for (const [label, timers] of this.timers.entries()) {
      const completedTimers = timers.filter((timer) => timer.end !== undefined)
      if (completedTimers.length === 0) {
        console.warn(`No completed timings for "${label}"`)
        continue
      }

      const totalTime = completedTimers.reduce(
        (acc, timer) => acc + (timer.end! - timer.start),
        0,
      )
      const avgTime = totalTime / completedTimers.length
      console.log(
        `${label}: ${avgTime.toFixed(3)}ms (${completedTimers.length}/${timers.length} calls)`,
      )
    }

    if (this.activeTimers.length > 0) {
      console.warn(
        "There are still active timers:",
        this.activeTimers.map((timer) => timer.label).join(", "),
      )
    }
  }

  reset(): void {
    this.timers.clear()
    this.activeTimers = []
  }
}
