import { useCallback, useEffect, useState } from 'react'
import {
  addBucketItem,
  addPlanItem,
  createPlan as createPlanRecord,
  deletePlan,
  getBucketList,
  getPlans,
  toggleBucketItem,
  togglePlanItem,
  updatePlan,
  type BucketListRecord,
  type PlanRecord,
} from '@/services/plans'

export function usePlans() {
  const [plans, setPlans] = useState<PlanRecord[]>([])
  const [bucketList, setBucketList] = useState<BucketListRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const [nextPlans, nextBucketList] = await Promise.all([getPlans(), getBucketList()])
      setPlans(nextPlans)
      setBucketList(nextBucketList)
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : 'Unable to load plans.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const handleCreatePlan = useCallback(async (payload: Parameters<typeof createPlanRecord>[0]) => {
    try {
      const result = await createPlanRecord(payload)
      if (result) {
        setPlans((current) => [result, ...current])
      }
      return result
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : 'Unable to create plan.'
      setError(message)
      return null
    }
  }, [])

  const handleUpdatePlan = useCallback(async (planId: string, updates: Parameters<typeof updatePlan>[1]) => {
    try {
      const result = await updatePlan(planId, updates)
      if (result) {
        setPlans((current) => current.map((plan) => (plan.id === planId ? { ...plan, ...result } : plan)))
      }
      return result
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : 'Unable to update plan.'
      setError(message)
      return null
    }
  }, [])

  const handleDeletePlan = useCallback(async (planId: string) => {
    try {
      await deletePlan(planId)
      setPlans((current) => current.filter((plan) => plan.id !== planId))
      return true
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : 'Unable to delete plan.'
      setError(message)
      return false
    }
  }, [])

  const handleAddPlanItem = useCallback(async (planId: string, title: string) => {
    try {
      const result = await addPlanItem(planId, title)
      if (result) {
        setPlans((current) =>
          current.map((plan) =>
            plan.id === planId ? { ...plan, plan_items: [...(plan.plan_items ?? []), result] } : plan,
          ),
        )
      }
      return result
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : 'Unable to add plan item.'
      setError(message)
      return null
    }
  }, [])

  const handleTogglePlanItem = useCallback(async (planId: string, itemId: string, completed: boolean) => {
    try {
      const result = await togglePlanItem(planId, itemId, completed)
      if (result) {
        setPlans((current) =>
          current.map((plan) =>
            plan.id === planId
              ? {
                  ...plan,
                  plan_items: (plan.plan_items ?? []).map((item) => (item.id === itemId ? { ...item, completed } : item)),
                }
              : plan,
          ),
        )
      }
      return result
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : 'Unable to update plan item.'
      setError(message)
      return null
    }
  }, [])

  const handleAddBucketItem = useCallback(async (item: string) => {
    try {
      const result = await addBucketItem(item)
      if (result) {
        setBucketList((current) => [result, ...current])
      }
      return result
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : 'Unable to add bucket list item.'
      setError(message)
      return null
    }
  }, [])

  const handleToggleBucketItem = useCallback(async (itemId: string, completed: boolean) => {
    try {
      const result = await toggleBucketItem(itemId, completed)
      if (result) {
        setBucketList((current) => current.map((item) => (item.id === itemId ? result : item)))
      }
      return result
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : 'Unable to update bucket item.'
      setError(message)
      return null
    }
  }, [])

  return {
    plans,
    bucketList,
    loading,
    error,
    refresh,
    createPlan: handleCreatePlan,
    updatePlan: handleUpdatePlan,
    deletePlan: handleDeletePlan,
    addPlanItem: handleAddPlanItem,
    togglePlanItem: handleTogglePlanItem,
    addBucketItem: handleAddBucketItem,
    toggleBucketItem: handleToggleBucketItem,
  }
}
