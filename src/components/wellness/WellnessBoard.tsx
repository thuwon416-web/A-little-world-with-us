// src/components/wellness/WellnessBoard.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { type WellnessBoard as BoardData } from '@/types/wellness'

interface WellnessBoardProps {
  board: BoardData
}

export default function WellnessBoard({ board }: WellnessBoardProps) {
  return (
    <Card className="bg-white/70 backdrop-blur-sm border-rose-200 shadow-sm hover:shadow-md transition-all">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl font-serif text-rose-900">
          <span className="text-3xl">{board.icon}</span>
          {board.title}
        </CardTitle>
        <CardDescription className="text-rose-700">{board.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {board.content && board.content.length > 0 ? (
          board.content.map((item, index) => (
            <div
              key={index}
              className="border-l-4 border-rose-300 pl-4 py-2 bg-rose-50/50 rounded-r-lg"
            >
              <p className="text-stone-800 italic font-medium">&ldquo;{item.text}&rdquo;</p>
              {item.action && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 text-rose-600 hover:text-rose-800 hover:bg-rose-100"
                >
                  ✨ {item.action}
                </Button>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-rose-600">
            <p className="text-sm">Coming soon...</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
