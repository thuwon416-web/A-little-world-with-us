import { Card, CardContent } from '@/components/ui/card'

const events = [
  { date: '2024-01-01', title: 'First Meeting', description: 'We met at the coffee shop.' },
  { date: '2024-06-15', title: 'First Trip', description: 'Our weekend in Paris.' },
]

export default function RelationshipTimeline() {
  return (
    <div className="space-y-6">
      {events.map((event, i) => (
        <Card key={i} className="border-l-4 border-l-rose-400">
          <CardContent>
            <p className="text-sm text-stone-500">{event.date}</p>
            <h3 className="text-xl font-serif">{event.title}</h3>
            <p>{event.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
