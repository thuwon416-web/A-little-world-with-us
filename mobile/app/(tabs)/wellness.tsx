import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  Armchair,
  Check,
  CalendarDays,
  CloudSun,
  Compass,
  Droplets,
  Dumbbell,
  Flower2,
  Gem,
  HandHeart,
  Handshake,
  Heart,
  HeartHandshake,
  Home,
  Package,
  PersonStanding,
  PlaneLanding,
  RefreshCw,
  Smile,
  Sparkles,
  Sunrise,
  Trophy,
  Volume2,
  VolumeX,
  type LucideIcon,
} from 'lucide-react-native'
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

import AffirmationDeck from '@/components/wellness/AffirmationDeck'
import ApologyCorner from '@/components/wellness/ApologyCorner'
import ArmchairMomentBoard from '@/components/wellness/ArmchairMomentBoard'
import CarefulQuietBoard from '@/components/wellness/CarefulQuietBoard'
import CoupleMoodMeter from '@/components/wellness/CoupleMoodMeter'
import CouplePromiseBoard from '@/components/wellness/CouplePromiseBoard'
import CozyReentryBoard from '@/components/wellness/CozyReentryBoard'
import DayEchoBoard from '@/components/wellness/DayEchoBoard'
import EasyBreathBoard from '@/components/wellness/EasyBreathBoard'
import EverydayRitualsBoard from '@/components/wellness/EverydayRitualsBoard'
import GentleHoldBoard from '@/components/wellness/GentleHoldBoard'
import GoldenLowBoard from '@/components/wellness/GoldenLowBoard'
import GratitudeWall from '@/components/wellness/GratitudeWall'
import LoveCheckInBoard from '@/components/wellness/LoveCheckInBoard'
import LoveNotesBoard from '@/components/wellness/LoveNotesBoard'
import MellowBloomBoard from '@/components/wellness/MellowBloomBoard'
import CycleTrackerBoard from '@/components/wellness/CycleTrackerBoard'
import PeriodSymptomsBoard from '@/components/wellness/PeriodSymptomsBoard'
import { EmptyState } from '@/components/ui/EmptyState'
import SteadyLandingBoard from '@/components/wellness/SteadyLandingBoard'
import TenderCompassBoard from '@/components/wellness/TenderCompassBoard'
import { enabledBoards, type WellnessBoard } from '@/data/wellness-boards'
import { workouts, type Workout } from '@/data/workouts'
import { useAuth } from '@/lib/auth'
import {
  getResetAdvice,
  getWellnessLogs,
  logWellnessActivity,
  type WellnessLog,
} from '@/services/wellnessTracking'

type Category = 'health' | 'mental' | 'relationship' | 'quests'

const categoryIconMap: Record<Category, LucideIcon> = {
  health: Dumbbell,
  mental: PersonStanding,
  relationship: Heart,
  quests: Trophy,
}

const categories: { id: Category; label: string }[] = [
  { id: 'health', label: 'Health' },
  { id: 'mental', label: 'Mental' },
  { id: 'relationship', label: 'Relationship' },
  { id: 'quests', label: 'Quests' },
]

const boardIconMap: Record<string, LucideIcon> = {
  Sparkles,
  Handshake,
  Package,
  Smile,
  Gem,
  Sunrise,
  PersonStanding,
  HeartHandshake,
  CloudSun,
  CalendarDays,
  Droplets,
  VolumeX,
  Volume2,
  Home,
  Armchair,
  HandHeart,
  Heart,
  Flower2,
  PlaneLanding,
  Compass,
  RefreshCw,
}

const boardCategories: Record<string, Category> = {
  affirmation: 'mental',
  apology: 'relationship',
  'mood-meter': 'mental',
  promise: 'relationship',
  rituals: 'relationship',
  breath: 'mental',
  hold: 'relationship',
  quiet: 'mental',
  'day-echo': 'mental',
  cozy: 'relationship',
  armchair: 'mental',
  gratitude: 'mental',
  'love-notes': 'relationship',
  'cycle-tracker': 'health',
  'period-symptoms': 'health',
  'golden-low': 'mental',
  'check-in': 'relationship',
  mellow: 'relationship',
  steady: 'health',
  'tender-compass': 'relationship',
}

const quests = [
  { id: 'love-notes-3', title: 'Send 3 love notes today', reward: 'Heart badge' },
  { id: 'date-night', title: 'Plan a date night', reward: 'Together badge' },
  { id: 'appreciations-5', title: 'Share 5 appreciations', reward: 'Gratitude badge' },
]

const componentMap: Record<string, React.ComponentType> = {
  AffirmationDeck,
  ApologyCorner,
  CoupleMoodMeter,
  CouplePromiseBoard,
  EverydayRitualsBoard,
  EasyBreathBoard,
  GentleHoldBoard,
  CarefulQuietBoard,
  DayEchoBoard,
  CozyReentryBoard,
  ArmchairMomentBoard,
  GratitudeWall,
  LoveNotesBoard,
  CycleTrackerBoard,
  PeriodSymptomsBoard,
  GoldenLowBoard,
  LoveCheckInBoard,
  MellowBloomBoard,
  SteadyLandingBoard,
  TenderCompassBoard,
}

function formatTime(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}

export default function WellnessScreen() {
  const { user } = useAuth()
  const [category, setCategory] = useState<Category>('health')
  const [selectedBoard, setSelectedBoard] = useState<WellnessBoard | null>(null)
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null)
  const [remaining, setRemaining] = useState(0)
  const [logs, setLogs] = useState<WellnessLog[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [advice, setAdvice] = useState('')
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const loadLogs = async () => {
    if (!user) return
    try {
      setLogs(await getWellnessLogs(user.id))
      setError('')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to load wellness history.')
    }
  }

  useEffect(() => {
    void loadLogs()
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [user?.id])

  const filteredBoards = useMemo(
    () =>
      enabledBoards.filter((board) => (boardCategories[board.id] ?? 'relationship') === category),
    [category]
  )
  const completedQuestIds = new Set(
    logs.filter((log) => log.activity_type === 'quest').map((log) => log.activity_id)
  )
  const workoutHistory = logs.filter((log) => log.activity_type === 'workout')

  const startWorkout = (workout: Workout) => {
    if (timerRef.current) clearInterval(timerRef.current)
    setSelectedWorkout(workout)
    setRemaining(workout.duration * 60)
    timerRef.current = setInterval(() => {
      setRemaining((current) => {
        if (current <= 1) {
          if (timerRef.current) clearInterval(timerRef.current)
          return 0
        }
        return current - 1
      })
    }, 1000)
  }

  const completeWorkout = async () => {
    if (!user || !selectedWorkout) return
    if (timerRef.current) clearInterval(timerRef.current)
    try {
      await logWellnessActivity(user.id, 'workout', selectedWorkout.id)
      setSelectedWorkout(null)
      setRemaining(0)
      await loadLogs()
    } catch (caught) {
      Alert.alert(
        'Unable to save workout',
        caught instanceof Error ? caught.message : 'Please try again.'
      )
    }
  }

  const completeQuest = async (questId: string) => {
    if (!user || completedQuestIds.has(questId)) return
    try {
      await logWellnessActivity(user.id, 'quest', questId)
      await loadLogs()
    } catch (caught) {
      Alert.alert(
        'Unable to save quest',
        caught instanceof Error ? caught.message : 'Please try again.'
      )
    }
  }

  const requestAdvice = async () => {
    try {
      setLoading(true)
      setAdvice(await getResetAdvice(category, 'neutral'))
    } catch (caught) {
      Alert.alert(
        'Guidance unavailable',
        caught instanceof Error ? caught.message : 'Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  const renderBoards = () => (
    <>
      {filteredBoards.length === 0 ? (
        <Text style={styles.muted}>More activities are coming to this category.</Text>
      ) : null}
      {filteredBoards.map((board) => {
        const BoardIcon = boardIconMap[board.icon] ?? Sparkles

        return (
          <TouchableOpacity
            key={board.id}
            style={styles.boardButton}
            onPress={() => setSelectedBoard(board)}
          >
            <BoardIcon size={28} color="#ff6b81" />
            <View style={styles.boardInfo}>
              <Text style={styles.boardName}>{board.name}</Text>
              <Text style={styles.muted}>{board.description}</Text>
            </View>
          </TouchableOpacity>
        )
      })}
    </>
  )

  if (selectedBoard) {
    const BoardComponent = componentMap[selectedBoard.component]
    return (
      <View style={styles.container}>
        <TouchableOpacity onPress={() => setSelectedBoard(null)}>
          <Text style={styles.link}>
            ‹ Back to {categories.find((item) => item.id === category)?.label}
          </Text>
        </TouchableOpacity>
        <Text style={styles.title}>{selectedBoard.name}</Text>
        <ScrollView contentContainerStyle={styles.boardContent}>
          {BoardComponent ? (
            <BoardComponent />
          ) : (
            <Text style={styles.muted}>Board unavailable.</Text>
          )}
        </ScrollView>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>CARE FOR EACH OTHER</Text>
        <Text style={styles.title}>Wellness</Text>
        <Text style={styles.subtitle}>Small rituals for feeling better together.</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryRow}
      >
        {categories.map((item) => {
          const CategoryIcon = categoryIconMap[item.id]

          return (
            <TouchableOpacity
              key={item.id}
              style={[styles.categoryButton, category === item.id && styles.categoryActive]}
              onPress={() => setCategory(item.id)}
            >
              <CategoryIcon size={20} color={category === item.id ? '#ff6b81' : '#d8b98c'} />
              <Text style={styles.categoryText}>{item.label}</Text>
            </TouchableOpacity>
          )
        })}
      </ScrollView>
      <ScrollView contentContainerStyle={styles.content}>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {category === 'health' ? (
          <>
            <Text style={styles.sectionTitle}>Workouts</Text>
            {selectedWorkout ? (
              <View style={styles.timerCard}>
                <Text style={styles.cardTitle}>{selectedWorkout.name}</Text>
                <Text style={styles.timer}>{formatTime(remaining)}</Text>
                <Text style={styles.muted}>
                  {remaining === 0
                    ? 'Time is up - mark it complete.'
                    : 'Move at a comfortable pace.'}
                </Text>
                <TouchableOpacity style={styles.primary} onPress={() => void completeWorkout()}>
                  <Text style={styles.primaryText}>Complete workout</Text>
                </TouchableOpacity>
              </View>
            ) : null}
            {workouts.map((workout) => (
              <View key={workout.id} style={styles.workout}>
                <View style={styles.workoutInfo}>
                  <Text style={styles.cardTitle}>{workout.name}</Text>
                  <Text style={styles.muted}>
                    {workout.duration} min · {workout.difficulty}
                  </Text>
                  <Text style={styles.muted}>{workout.description}</Text>
                </View>
                <TouchableOpacity style={styles.smallButton} onPress={() => startWorkout(workout)}>
                  <Text style={styles.smallButtonText}>Start</Text>
                </TouchableOpacity>
              </View>
            ))}
            <Text style={styles.sectionTitle}>Workout history</Text>
            {workoutHistory.length ? (
              workoutHistory.slice(0, 5).map((log) => (
                <Text key={log.id} style={styles.history}>
                  {workouts.find((workout) => workout.id === log.activity_id)?.name ??
                    log.activity_id}{' '}
                  · {new Date(log.completed_at).toLocaleDateString()}
                </Text>
              ))
            ) : (
              <EmptyState
                icon={Dumbbell}
                title="No workouts yet"
                description="Complete a workout to start your history."
              />
            )}
          </>
        ) : null}
        {category === 'quests' ? (
          <>
            <Text style={styles.sectionTitle}>Challenges</Text>
            {quests.map((quest) => (
              <TouchableOpacity
                key={quest.id}
                style={[styles.quest, completedQuestIds.has(quest.id) && styles.completed]}
                onPress={() => void completeQuest(quest.id)}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  {completedQuestIds.has(quest.id) ? <Check size={14} color="#8ed0c4" /> : null}
                  <Text style={styles.cardTitle}>{quest.title}</Text>
                </View>
                <Text style={styles.muted}>
                  {completedQuestIds.has(quest.id) ? 'Completed' : quest.reward}
                </Text>
              </TouchableOpacity>
            ))}
          </>
        ) : null}
        {category !== 'health' && category !== 'quests' ? (
          <>
            <Text style={styles.sectionTitle}>
              {categories.find((item) => item.id === category)?.label} boards
            </Text>
            {renderBoards()}
          </>
        ) : null}
        <TouchableOpacity style={styles.adviceButton} onPress={() => void requestAdvice()}>
          <Text style={styles.adviceText}>Need guidance?</Text>
        </TouchableOpacity>
        {loading ? <ActivityIndicator color="#ff9bba" /> : null}
        {advice ? (
          <View style={styles.adviceCard}>
            <Text style={styles.cardTitle}>A gentle reset</Text>
            <Text style={styles.advice}>{advice}</Text>
          </View>
        ) : null}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f13' },
  header: { padding: 20, paddingTop: 64, backgroundColor: '#171b27' },
  eyebrow: { color: '#d5c4d4', letterSpacing: 2, fontSize: 11 },
  title: { color: '#f4edf5', fontSize: 28, fontWeight: '800', marginTop: 5 },
  subtitle: { color: '#d5c4d4', marginTop: 5 },
  categoryRow: { padding: 12, gap: 8, backgroundColor: '#171b27' },
  categoryButton: {
    minWidth: 83,
    alignItems: 'center',
    padding: 10,
    borderRadius: 13,
    backgroundColor: '#2d3140',
  },
  categoryActive: { backgroundColor: '#604582', borderWidth: 1, borderColor: '#ff9bba' },
  categoryIcon: { fontSize: 20 },
  categoryText: { color: '#fff', fontSize: 11, marginTop: 4 },
  content: { padding: 16, gap: 10 },
  boardContent: { paddingVertical: 16, gap: 12 },
  sectionTitle: { color: '#fff', fontSize: 19, fontWeight: '800', marginTop: 8 },
  boardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#171b27',
    padding: 14,
    borderRadius: 15,
  },
  boardIcon: { fontSize: 26 },
  boardInfo: { flex: 1 },
  boardName: { color: '#fff', fontWeight: '700', fontSize: 15 },
  muted: { color: '#c4bfd0', fontSize: 13, lineHeight: 19 },
  workout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#171b27',
    padding: 14,
    borderRadius: 15,
  },
  workoutInfo: { flex: 1, gap: 3 },
  cardTitle: { color: '#fff', fontSize: 15, fontWeight: '800' },
  smallButton: {
    backgroundColor: '#ff6b81',
    paddingVertical: 9,
    paddingHorizontal: 13,
    borderRadius: 10,
  },
  smallButtonText: { color: '#fff', fontWeight: '800' },
  timerCard: {
    backgroundColor: '#604582',
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    gap: 7,
  },
  timer: { color: '#fff', fontSize: 44, fontWeight: '800' },
  primary: { backgroundColor: '#ff6b81', borderRadius: 11, padding: 12, marginTop: 5 },
  primaryText: { color: '#fff', fontWeight: '800' },
  history: { color: '#d5c4d4', padding: 11, backgroundColor: '#171b27', borderRadius: 11 },
  quest: { backgroundColor: '#171b27', padding: 15, borderRadius: 15, gap: 4 },
  completed: { borderColor: '#86d6ad', borderWidth: 1 },
  adviceButton: {
    backgroundColor: '#ff6b81',
    borderRadius: 13,
    padding: 13,
    alignItems: 'center',
    marginTop: 12,
  },
  adviceText: { color: '#fff', fontWeight: '800' },
  adviceCard: { backgroundColor: '#221d2d', borderRadius: 14, padding: 15, gap: 7 },
  advice: { color: '#f4edf5', lineHeight: 21 },
  link: { color: '#ff9bba', padding: 20, paddingTop: 60, fontWeight: '800' },
  error: { color: '#ff9b9b' },
})
