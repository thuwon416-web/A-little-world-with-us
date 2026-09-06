export interface WellnessBoard {
  id: string
  name: string
  icon: string
  component: string
  enabled: boolean
  description?: string
}

export const wellnessBoards: WellnessBoard[] = [
  // Enabled boards (20 boards - use existing components)
  {
    id: 'affirmation',
    name: 'Affirmations',
    icon: '✨',
    component: 'AffirmationDeck',
    enabled: true,
    description: 'Daily affirmations for couples',
  },
  {
    id: 'apology',
    name: 'Apology Corner',
    icon: '🤝',
    component: 'ApologyCorner',
    enabled: true,
    description: 'Say sorry and move forward',
  },
  {
    id: 'appreciation',
    name: 'Appreciation Jar',
    icon: '🫙',
    component: 'AppreciationJar',
    enabled: true,
    description: 'Collect moments of gratitude',
  },
  {
    id: 'mood-meter',
    name: 'Couple Mood Meter',
    icon: '😊',
    component: 'CoupleMoodMeter',
    enabled: true,
    description: "Track each other's mood",
  },
  {
    id: 'promise',
    name: 'Promise Board',
    icon: '💍',
    component: 'CouplePromiseBoard',
    enabled: true,
    description: 'Make and keep promises',
  },
  {
    id: 'rituals',
    name: 'Everyday Rituals',
    icon: '🌅',
    component: 'EverydayRitualsBoard',
    enabled: true,
    description: 'Build healthy habits together',
  },
  {
    id: 'breath',
    name: 'Easy Breath',
    icon: '🧘',
    component: 'EasyBreathBoard',
    enabled: true,
    description: 'Breathe together',
  },
  {
    id: 'hold',
    name: 'Gentle Hold',
    icon: '🤗',
    component: 'GentleHoldBoard',
    enabled: true,
    description: 'Virtual hugs',
  },
  {
    id: 'forecast',
    name: 'Gentle Forecast',
    icon: '🌤️',
    component: 'GentleForecastBoard',
    enabled: true,
    description: 'Predict your day together',
  },
  {
    id: 'quiet',
    name: 'Careful Quiet',
    icon: '🤫',
    component: 'CarefulQuietBoard',
    enabled: true,
    description: 'Peaceful silence together',
  },
  {
    id: 'day-echo',
    name: 'Day Echo',
    icon: '🔊',
    component: 'DayEchoBoard',
    enabled: true,
    description: 'Reflect on your day',
  },
  {
    id: 'cozy',
    name: 'Cozy Reentry',
    icon: '🏠',
    component: 'CozyReentryBoard',
    enabled: true,
    description: 'Welcome home rituals',
  },
  {
    id: 'armchair',
    name: 'Armchair Moment',
    icon: '🪑',
    component: 'ArmchairMomentBoard',
    enabled: true,
    description: 'Relax together',
  },
  {
    id: 'gratitude',
    name: 'Gratitude Wall',
    icon: '🙏',
    component: 'GratitudeWall',
    enabled: true,
    description: "Share what you're grateful for",
  },
  {
    id: 'love-notes',
    name: 'Love Notes',
    icon: '💕',
    component: 'LoveNotesBoard',
    enabled: true,
    description: 'Express your love',
  },
  {
    id: 'reassurance',
    name: 'Reassurance Counter',
    icon: '💚',
    component: 'ReassuranceCounter',
    enabled: true,
    description: 'Count reassurances',
  },
  {
    id: 'golden-low',
    name: 'Golden Low',
    icon: '🌅',
    component: 'GoldenLowBoard',
    enabled: true,
    description: 'Find peace in low moments',
  },
  {
    id: 'check-in',
    name: 'Love Check-in',
    icon: '❤️',
    component: 'LoveCheckInBoard',
    enabled: true,
    description: 'Daily relationship check-in',
  },
  {
    id: 'mellow',
    name: 'Mellow Bloom',
    icon: '🌸',
    component: 'MellowBloomBoard',
    enabled: true,
    description: 'Grow together',
  },
  {
    id: 'steady',
    name: 'Steady Landing',
    icon: '🛬',
    component: 'SteadyLandingBoard',
    enabled: true,
    description: 'Find your footing together',
  },
]

// Export only enabled boards for easy access
export const enabledBoards = wellnessBoards.filter((b) => b.enabled)