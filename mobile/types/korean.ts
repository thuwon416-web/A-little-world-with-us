// Korean Learning Feature — Shared Types
// Keep synchronized with src/types/korean.ts until a shared package is introduced.

export type KoreanLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7

export const KOREAN_LEVELS: Record<
  KoreanLevel,
  {
    title: string
    titleMy: string
    description: string
    estimatedHours: number
  }
> = {
  1: {
    title: 'Hangul Foundations',
    titleMy: 'ဟန်ဂူးလ် အခြေခံများ',
    description: 'Learn the Korean alphabet, sounds, and simple syllables.',
    estimatedHours: 8,
  },
  2: {
    title: 'Everyday Greetings',
    titleMy: 'နေ့စဉ်နှုတ်ဆက်စကားများ',
    description: 'Use common greetings, introductions, and polite expressions.',
    estimatedHours: 10,
  },
  3: {
    title: 'Daily Life',
    titleMy: 'နေ့စဉ်ဘဝ',
    description: 'Talk about routines, people, places, and simple activities.',
    estimatedHours: 14,
  },
  4: {
    title: 'Conversation Builder',
    titleMy: 'စကားပြောစွမ်းရည် တိုးတက်ခြင်း',
    description: 'Build longer sentences and respond in everyday conversations.',
    estimatedHours: 18,
  },
  5: {
    title: 'Practical Korean',
    titleMy: 'လက်တွေ့ကိုရီးယားစကား',
    description: 'Handle travel, shopping, plans, and practical situations.',
    estimatedHours: 22,
  },
  6: {
    title: 'Natural Expression',
    titleMy: 'သဘာဝကျသော ပြောဆိုပုံများ',
    description: 'Understand nuance, informal speech, and natural expressions.',
    estimatedHours: 28,
  },
  7: {
    title: 'Confident Fluency',
    titleMy: 'ယုံကြည်မှုရှိသော ကျွမ်းကျင်မှု',
    description: 'Express ideas comfortably across familiar Korean topics.',
    estimatedHours: 36,
  },
}

export type KoreanLesson = {
  id: string
  level: KoreanLevel
  title: string
  titleMy: string
  description: string
  order: number
  createdAt: string
  updatedAt: string
}

export type KoreanVocab = {
  id: string
  lessonId: string
  korean: string
  romanization: string
  english: string
  myanmar: string
  audioUrl: string | null
  exampleSentence: string | null
  exampleTranslation: string | null
  level: KoreanLevel
  tags: string[]
  createdAt: string
}

export type QuizType = 'multiple_choice' | 'fill_blank' | 'matching' | 'listening' | 'typing'

export type KoreanQuizQuestion = {
  id: string
  sessionId: string
  vocabId: string
  questionType: QuizType
  questionText: string
  options: string[] | null
  correctAnswer: string
  userAnswer: string | null
  isCorrect: boolean | null
  answeredAt: string | null
  createdAt: string
}

export type KoreanQuizSession = {
  id: string
  coupleId: string
  createdBy: string
  targetUser: string
  level: KoreanLevel
  quizType: QuizType
  focusCategories: string[]
  status: 'pending' | 'in_progress' | 'completed'
  score: number | null
  totalQuestions: number
  startedAt: string | null
  completedAt: string | null
  createdAt: string
}

export type KoreanProgress = {
  id: string
  userId: string
  vocabId: string
  masteryLevel: 0 | 1 | 2 | 3 | 4 | 5
  timesCorrect: number
  timesWrong: number
  lastReviewedAt: string
  nextReviewAt: string
  createdAt: string
  updatedAt: string
}

export type KoreanStats = {
  level: KoreanLevel
  totalWords: number
  masteredWords: number
  streak: number
  lastActivity: string | null
  percentToNextLevel: number
}

export type QuizAttemptAnswer = {
  vocabId: string
  userAnswer: string
  isCorrect: boolean
  timeSpentMs: number
}
