import { useCallback, useEffect, useState } from 'react'

import {
  getCareStats,
  getMoodHistory,
  logCare,
  logCycle,
  logMood,
  predictCycle,
  type CareType,
  type MoodValue,
} from '@/services/wellness'

export function useWellness() {
  const [moodHistory, setMoodHistory] = useState<any[]>([])
  const [careStats, setCareStats] = useState({ total: 0, percentage: 0, completed: 0 })
  const [prediction, setPrediction] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const [history, stats, nextPrediction] = await Promise.all([
        getMoodHistory(7),
        getCareStats(),
        predictCycle(),
      ])
      setMoodHistory(history)
      setCareStats(stats)
      setPrediction(nextPrediction)
    } catch (caughtError) {
      const message =
        caughtError instanceof Error ? caughtError.message : 'Unable to load wellness data.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const logMoodEntry = useCallback(async (mood: MoodValue, note?: string) => {
    try {
      const result = await logMood(mood, note)
      if (result) {
        setMoodHistory((current) => [result, ...current])
      }
      return result
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : 'Unable to log mood.'
      setError(message)
      return null
    }
  }, [])

  const logCareEntry = useCallback(async (type: CareType) => {
    try {
      const result = await logCare(type)
      if (result) {
        const nextStats = await getCareStats()
        setCareStats(nextStats)
      }
      return result
    } catch (caughtError) {
      const message =
        caughtError instanceof Error ? caughtError.message : 'Unable to log care item.'
      setError(message)
      return null
    }
  }, [])

  const logCycleEntry = useCallback(
    async (startDate: string, endDate?: string, cycleLength?: number) => {
      try {
        const result = await logCycle(startDate, endDate, cycleLength)
        if (result) {
          const nextPrediction = await predictCycle()
          setPrediction(nextPrediction)
        }
        return result
      } catch (caughtError) {
        const message = caughtError instanceof Error ? caughtError.message : 'Unable to log cycle.'
        setError(message)
        return null
      }
    },
    []
  )

  return {
    moodHistory,
    careStats,
    prediction,
    loading,
    error,
    refresh,
    logMoodEntry,
    logCareEntry,
    logCycleEntry,
  }
}
