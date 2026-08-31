import { useState, useEffect } from 'react'

interface CycleData {
  lastPeriodStart: string
  averageCycleLength: number
  currentPhase: 'menstrual' | 'follicular' | 'ovulation' | 'luteal'
  daysUntilNext: number
}

export function useCycle(lastPeriodStart: string, cycleLength = 28) {
  const [cycleData, setCycleData] = useState<CycleData | null>(null)

  useEffect(() => {
    const calculate = () => {
      const lastPeriod = new Date(lastPeriodStart)
      const now = new Date()
      const diffDays = Math.floor((now.getTime() - lastPeriod.getTime()) / (1000 * 60 * 60 * 24))
      const dayInCycle = diffDays % cycleLength

      let currentPhase: CycleData['currentPhase']
      if (dayInCycle < 5) currentPhase = 'menstrual'
      else if (dayInCycle < 14) currentPhase = 'follicular'
      else if (dayInCycle < 17) currentPhase = 'ovulation'
      else currentPhase = 'luteal'

      const daysUntilNext = cycleLength - (diffDays % cycleLength)

      setCycleData({
        lastPeriodStart,
        averageCycleLength: cycleLength,
        currentPhase,
        daysUntilNext,
      })
    }

    calculate()
  }, [lastPeriodStart, cycleLength])

  return cycleData
}
