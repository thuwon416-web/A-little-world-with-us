export type Workout = {
  id: string
  name: string
  duration: number
  difficulty: 'Easy' | 'Medium' | 'Hard'
  description: string
}

export const workouts: Workout[] = [
  {
    id: 'seven-minute',
    name: '7-Minute Workout',
    duration: 7,
    difficulty: 'Easy',
    description: 'A gentle full-body reset for busy days.',
  },
  {
    id: 'yoga-flow',
    name: 'Yoga Flow',
    duration: 15,
    difficulty: 'Medium',
    description: 'Stretch, breathe, and reconnect with your body.',
  },
  {
    id: 'hiit-cardio',
    name: 'HIIT Cardio',
    duration: 20,
    difficulty: 'Hard',
    description: 'A high-energy workout to get your heart moving.',
  },
  {
    id: 'couple-walk',
    name: 'Couple Walk',
    duration: 30,
    difficulty: 'Easy',
    description: 'A relaxed walk with time to talk.',
  },
  {
    id: 'core-reset',
    name: 'Core Reset',
    duration: 12,
    difficulty: 'Medium',
    description: 'Build strength with a focused core session.',
  },
  {
    id: 'evening-stretch',
    name: 'Evening Stretch',
    duration: 10,
    difficulty: 'Easy',
    description: 'Release tension before winding down.',
  },
]
