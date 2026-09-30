import FutureDatePlanner from '@/features/planning/FutureDatePlanner'
import BucketList from '@/features/planning/BucketList'

export default function PlanningPage() {
  return (
    <div>
      <h1 className="text-3xl font-serif mb-6">Plan Our Future</h1>
      <FutureDatePlanner />
      <div className="mt-8">
        <BucketList />
      </div>
    </div>
  )
}
