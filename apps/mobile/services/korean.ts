import { supabase } from '@/lib/supabase'
import type {
  KoreanLesson,
  KoreanProgress,
  KoreanQuizQuestion,
  KoreanQuizSession,
  KoreanVocab,
  QuizType,
} from '@/types/korean'

type LessonRow = {
  id: string
  level: KoreanLesson['level']
  title: string
  title_my: string
  description: string
  lesson_order: number
  created_at: string
  updated_at: string
}

type VocabRow = {
  id: string
  lesson_id: string
  level: KoreanVocab['level']
  korean: string
  romanization: string
  english: string
  myanmar: string
  audio_url: string | null
  example_sentence: string | null
  example_translation: string | null
  tags: string[]
  created_at: string
}

type QuizSessionRow = {
  id: string
  couple_id: string
  created_by: string
  target_user: string
  level: KoreanQuizSession['level']
  quiz_type: QuizType
  focus_categories: string[]
  status: KoreanQuizSession['status']
  score: number | null
  total_questions: number
  started_at: string | null
  completed_at: string | null
  created_at: string
}

type QuizQuestionRow = {
  id: string
  session_id: string
  vocab_id: string
  question_type: QuizType
  question_text: string
  options: string[] | null
  correct_answer: string
  user_answer: string | null
  is_correct: boolean | null
  answered_at: string | null
  created_at: string
}

type ProgressRow = {
  id: string
  user_id: string
  vocab_id: string
  mastery_level: KoreanProgress['masteryLevel']
  times_correct: number
  times_wrong: number
  last_reviewed_at: string
  next_review_at: string
  created_at: string
  updated_at: string
}

const mapLesson = (row: LessonRow): KoreanLesson => ({
  id: row.id,
  level: row.level,
  title: row.title,
  titleMy: row.title_my,
  description: row.description,
  order: row.lesson_order,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
})
const mapVocab = (row: VocabRow): KoreanVocab => ({
  id: row.id,
  lessonId: row.lesson_id,
  korean: row.korean,
  romanization: row.romanization,
  english: row.english,
  myanmar: row.myanmar,
  audioUrl: row.audio_url,
  exampleSentence: row.example_sentence,
  exampleTranslation: row.example_translation,
  level: row.level,
  tags: row.tags,
  createdAt: row.created_at,
})
const mapSession = (row: QuizSessionRow): KoreanQuizSession => ({
  id: row.id,
  coupleId: row.couple_id,
  createdBy: row.created_by,
  targetUser: row.target_user,
  level: row.level,
  quizType: row.quiz_type,
  focusCategories: row.focus_categories,
  status: row.status,
  score: row.score,
  totalQuestions: row.total_questions,
  startedAt: row.started_at,
  completedAt: row.completed_at,
  createdAt: row.created_at,
})
const mapQuestion = (row: QuizQuestionRow): KoreanQuizQuestion => ({
  id: row.id,
  sessionId: row.session_id,
  vocabId: row.vocab_id,
  questionType: row.question_type,
  questionText: row.question_text,
  options: row.options,
  correctAnswer: row.correct_answer,
  userAnswer: row.user_answer,
  isCorrect: row.is_correct,
  answeredAt: row.answered_at,
  createdAt: row.created_at,
})
const mapProgress = (row: ProgressRow): KoreanProgress => ({
  id: row.id,
  userId: row.user_id,
  vocabId: row.vocab_id,
  masteryLevel: row.mastery_level,
  timesCorrect: row.times_correct,
  timesWrong: row.times_wrong,
  lastReviewedAt: row.last_reviewed_at,
  nextReviewAt: row.next_review_at,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
})

export async function getLessons(level?: KoreanLesson['level']): Promise<KoreanLesson[]> {
  let query = supabase.from('korean_lessons').select('*').order('lesson_order')
  if (level !== undefined) query = query.eq('level', level)
  const { data, error } = await query
  if (error) throw error
  return ((data ?? []) as LessonRow[]).map(mapLesson)
}

export async function getVocabByLesson(lessonId: string): Promise<KoreanVocab[]> {
  const { data, error } = await supabase
    .from('korean_vocab')
    .select('*')
    .eq('lesson_id', lessonId)
    .order('created_at')
  if (error) throw error
  return ((data ?? []) as VocabRow[]).map(mapVocab)
}

export async function createQuizSession(input: {
  coupleId: string
  createdBy: string
  targetUser: string
  level: KoreanQuizSession['level']
  quizType: QuizType
  focusCategories: string[]
  totalQuestions: number
}): Promise<KoreanQuizSession> {
  const { data, error } = await supabase
    .from('korean_quiz_sessions')
    .insert({
      couple_id: input.coupleId,
      created_by: input.createdBy,
      target_user: input.targetUser,
      level: input.level,
      quiz_type: input.quizType,
      focus_categories: input.focusCategories,
      total_questions: input.totalQuestions,
    })
    .select('*')
    .single()
  if (error) throw error
  return mapSession(data as QuizSessionRow)
}

export async function getQuizSession(sessionId: string): Promise<{
  session: KoreanQuizSession
  questions: KoreanQuizQuestion[]
}> {
  const [{ data: session, error: sessionError }, { data: questions, error: questionsError }] =
    await Promise.all([
      supabase.from('korean_quiz_sessions').select('*').eq('id', sessionId).single(),
      supabase
        .from('korean_quiz_questions')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at'),
    ])
  if (sessionError) throw sessionError
  if (questionsError) throw questionsError
  return {
    session: mapSession(session as QuizSessionRow),
    questions: ((questions ?? []) as QuizQuestionRow[]).map(mapQuestion),
  }
}

export async function submitAnswer(
  questionId: string,
  userAnswer: string
): Promise<KoreanQuizQuestion> {
  const { data: question, error: readError } = await supabase
    .from('korean_quiz_questions')
    .select('*')
    .eq('id', questionId)
    .single()
  if (readError) throw readError
  const row = question as QuizQuestionRow
  const { data, error } = await supabase
    .from('korean_quiz_questions')
    .update({
      user_answer: userAnswer,
      is_correct:
        userAnswer.trim().toLocaleLowerCase() === row.correct_answer.trim().toLocaleLowerCase(),
      answered_at: new Date().toISOString(),
    })
    .eq('id', questionId)
    .select('*')
    .single()
  if (error) throw error
  return mapQuestion(data as QuizQuestionRow)
}

export async function getProgress(userId: string): Promise<KoreanProgress[]> {
  const { data, error } = await supabase
    .from('korean_progress')
    .select('*')
    .eq('user_id', userId)
    .order('next_review_at')
  if (error) throw error
  return ((data ?? []) as ProgressRow[]).map(mapProgress)
}

export async function upsertProgress(
  userId: string,
  vocabId: string,
  progress: Omit<KoreanProgress, 'id' | 'userId' | 'vocabId' | 'createdAt' | 'updatedAt'>
): Promise<KoreanProgress> {
  const { data: authData, error: authError } = await supabase.auth.getUser()
  if (authError) throw authError
  if (!authData.user || authData.user.id !== userId) throw new Error('User not authenticated')
  const { data, error } = await supabase
    .from('korean_progress')
    .upsert(
      {
        user_id: userId,
        vocab_id: vocabId,
        mastery_level: progress.masteryLevel,
        times_correct: progress.timesCorrect,
        times_wrong: progress.timesWrong,
        last_reviewed_at: progress.lastReviewedAt,
        next_review_at: progress.nextReviewAt,
      },
      { onConflict: 'user_id,vocab_id' }
    )
    .select('*')
    .single()
  if (error) throw error
  return mapProgress(data as ProgressRow)
}
