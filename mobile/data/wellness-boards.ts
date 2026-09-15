export interface WellnessBoard {
  id: string
  name: string
  icon: string
  component: string
  enabled: boolean
  description?: string
  category?: 'health' | 'mental' | 'relationship' | 'quests' | 'games'
}

export const wellnessBoards: WellnessBoard[] = [
  // Enabled boards (20 boards - use existing components)
  {
    id: 'affirmation',
    name: 'Affirmations',
    icon: 'Sparkles',
    component: 'AffirmationDeck',
    enabled: true,
    description: 'Daily affirmations for couples',
  },
  {
    id: 'apology',
    name: 'Apology Corner',
    icon: 'Handshake',
    component: 'ApologyCorner',
    enabled: true,
    description: 'Say sorry and move forward',
  },
  {
    id: 'mood-meter',
    name: 'Couple Mood Meter',
    icon: 'Smile',
    component: 'CoupleMoodMeter',
    enabled: true,
    description: "Track each other's mood",
  },
  {
    id: 'promise',
    name: 'Promise Board',
    icon: 'Gem',
    component: 'CouplePromiseBoard',
    enabled: true,
    description: 'Make and keep promises',
  },
  {
    id: 'rituals',
    name: 'Everyday Rituals',
    icon: 'Sunrise',
    component: 'EverydayRitualsBoard',
    enabled: true,
    description: 'Build healthy habits together',
  },
  {
    id: 'breath',
    name: 'Easy Breath',
    icon: 'PersonStanding',
    component: 'EasyBreathBoard',
    enabled: true,
    description: 'Breathe together',
  },
  {
    id: 'hold',
    name: 'Gentle Hold',
    icon: 'HeartHandshake',
    component: 'GentleHoldBoard',
    enabled: true,
    description: 'Virtual hugs',
  },
  {
    id: 'quiet',
    name: 'Careful Quiet',
    icon: 'VolumeX',
    component: 'CarefulQuietBoard',
    enabled: true,
    description: 'Peaceful silence together',
  },
  {
    id: 'day-echo',
    name: 'Day Echo',
    icon: 'Volume2',
    component: 'DayEchoBoard',
    enabled: true,
    description: 'Reflect on your day',
  },
  {
    id: 'cozy',
    name: 'Cozy Reentry',
    icon: 'Home',
    component: 'CozyReentryBoard',
    enabled: true,
    description: 'Welcome home rituals',
  },
  {
    id: 'armchair',
    name: 'Armchair Moment',
    icon: 'Armchair',
    component: 'ArmchairMomentBoard',
    enabled: true,
    description: 'Relax together',
  },
  {
    id: 'gratitude',
    name: 'Gratitude Wall',
    icon: 'HandHeart',
    component: 'GratitudeWall',
    enabled: true,
    description: "Share what you're grateful for",
  },
  {
    id: 'love-notes',
    name: 'Love Notes',
    icon: 'Heart',
    component: 'LoveNotesBoard',
    enabled: true,
    description: 'Express your love',
  },
  {
    id: 'golden-low',
    name: 'Golden Low',
    icon: 'Sunrise',
    component: 'GoldenLowBoard',
    enabled: true,
    description: 'Find peace in low moments',
  },
  {
    id: 'check-in',
    name: 'Love Check-in',
    icon: 'Heart',
    component: 'LoveCheckInBoard',
    enabled: true,
    description: 'Daily relationship check-in',
  },
  {
    id: 'mellow',
    name: 'Mellow Bloom',
    icon: 'Flower2',
    component: 'MellowBloomBoard',
    enabled: true,
    description: 'Grow together',
  },
  {
    id: 'steady',
    name: 'Steady Landing',
    icon: 'PlaneLanding',
    component: 'SteadyLandingBoard',
    enabled: true,
    description: 'Find your footing together',
  },
  {
    id: 'tender-compass',
    name: 'Tender Compass',
    icon: 'Compass',
    component: 'TenderCompassBoard',
    enabled: true,
    category: 'relationship',
    description: 'Gentle guidance for difficult moments.',
  },
  {
    id: 'cycle-tracker',
    name: 'Cycle Tracker',
    icon: 'CalendarDays',
    component: 'CycleTrackerBoard',
    enabled: true,
    category: 'health',
    description: 'Track your menstrual cycle',
  },
  {
    id: 'period-symptoms',
    name: 'Period Symptoms',
    icon: 'Droplets',
    component: 'PeriodSymptomsBoard',
    enabled: true,
    category: 'health',
    description: 'Log cramps, bloating, and other symptoms',
  },
]

// Export only enabled boards for easy access
export const enabledBoards = wellnessBoards.filter((b) => b.enabled)
