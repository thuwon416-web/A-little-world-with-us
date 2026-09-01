import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function GuidedJourney() {
  return (
    <Card className="p-6 text-center bg-gradient-to-br from-rose-100 to-lavender-100">
      <h2 className="text-2xl font-serif mb-4">Our Journey</h2>
      <p className="mb-4">Take a step back and relive the moments that made us.</p>
      <Button className="bg-rose-600 hover:bg-rose-700">Start Journey</Button>
    </Card>
  )
}
