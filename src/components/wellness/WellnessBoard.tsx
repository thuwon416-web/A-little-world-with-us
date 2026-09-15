// src/components/wellness/WellnessBoard.tsx
import {
  Bell,
  CalendarDays,
  Clock3,
  CloudSun,
  Compass,
  Droplets,
  Flower2,
  Gem,
  HandHeart,
  Handshake,
  Heart,
  HeartHandshake,
  Home,
  Leaf,
  Mail,
  MessageSquareText,
  Package,
  PartyPopper,
  PersonStanding,
  PlaneLanding,
  RefreshCw,
  Smile,
  Sparkles,
  Stars,
  Volume2,
  VolumeX,
  type LucideIcon,
} from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { type WellnessBoard as BoardData } from '@/types/wellness'

interface WellnessBoardProps {
  board: BoardData
}

const boardIconMap: Record<string, LucideIcon> = {
  CalendarDays,
  Droplets,
  PersonStanding,
  Leaf,
  RefreshCw,
  HeartHandshake,
  CloudSun,
  Compass,
  VolumeX,
  Volume2,
  Home,
  Gem,
  Bell,
  HandHeart,
  Heart,
  Sparkles,
  MessageSquareText,
  Package,
  Handshake,
  Stars,
  Mail,
  PartyPopper,
  Clock3,
  Flower2,
  PlaneLanding,
  Smile,
}

export default function WellnessBoard({ board }: WellnessBoardProps) {
  const Icon = boardIconMap[board.icon] ?? Sparkles

  return (
    <Card className="bg-white/70 backdrop-blur-sm border-rose-200 shadow-sm hover:shadow-md transition-all">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl font-serif text-rose-900">
          <Icon className="h-7 w-7 text-rose-600" />
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
              <p className="text-stone-800 italic font-medium">&ldquo;{item}&rdquo;</p>
            </div>
          ))
        ) : (
          <EmptyState
            icon={Sparkles}
            title="No entries yet"
            description="Add your first gentle check-in when you are ready."
          />
        )}
      </CardContent>
    </Card>
  )
}
