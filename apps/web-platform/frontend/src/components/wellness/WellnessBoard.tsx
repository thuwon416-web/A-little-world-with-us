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
import { useLanguage } from '@/contexts/LanguageContext'

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
  const { language } = useLanguage()
  const isMm = language === 'my'
  const Icon = boardIconMap[board.icon] ?? Sparkles

  const title = isMm && board.titleMy ? board.titleMy : board.title
  const description = isMm && board.descriptionMy ? board.descriptionMy : board.description

  return (
    <Card className="bg-card/70 backdrop-blur-sm border-accent-1/20 shadow-card hover:shadow-card-hover transition-all">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl font-serif text-card-title">
          <Icon className="h-7 w-7 text-accent-1" />
          {title}
        </CardTitle>
        <CardDescription className="text-text-2">{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {board.content && board.content.length > 0 ? (
          board.content.map((item, index) => (
            <div
              key={index}
              className="border-l-4 border-accent-1/30 pl-4 py-2 bg-accent-1/5 rounded-r-lg"
            >
              <p className="text-text-1 italic font-medium">&ldquo;{item}&rdquo;</p>
            </div>
          ))
        ) : (
          <EmptyState
            icon={Sparkles}
            title={isMm ? 'မှတ်တမ်း မရှိသေးပါ' : 'No entries yet'}
            description={
              isMm
                ? 'အဆင်ပြေသည့်အချိန်တွင် ပထမဆုံး စာရင်းသွင်းနိုင်ပါသည်။'
                : 'Add your first gentle check-in when you are ready.'
            }
          />
        )}
      </CardContent>
    </Card>
  )
}
