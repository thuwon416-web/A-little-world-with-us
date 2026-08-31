import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function DailyRitualReminder() {
  return (
    <Card className="bg-amber-50 border-amber-200">
      <CardContent className="flex items-center justify-between p-4">
        <div>
          <h3 className="font-serif text-lg">🌅 Good Morning Ritual</h3>
          <p className="text-sm text-stone-600">Send your morning message now!</p>
        </div>
        <Button variant="outline" className="border-amber-400 text-amber-700">
          Do it
        </Button>
      </CardContent>
    </Card>
  )
}
