import FutureDatePlanner from '@/features/planning/FutureDatePlanner'
import BucketList from '@/features/planning/BucketList'

export default function PlanningPage() {
  return (
    <div className="space-y-6">
      <div className="glass-card rounded-2xl border border-border/70 bg-card p-5 shadow-card">
        <FutureDatePlanner />
      </div>
      <div className="glass-card rounded-2xl border border-border/70 bg-card p-5 shadow-card">
        <BucketList />
      </div>
    </div>
  )
}
