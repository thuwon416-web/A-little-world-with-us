import { Volume2 } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { TouchableOpacity, Text, TextInput, View } from 'react-native'

import type { ThemeColors } from '@/context/ThemeContext'
import { isTTSSupported, speakKorean, stopSpeaking } from '@/lib/tts'
import type { KoreanVocab, QuizType } from '@/types/korean'

export type MobileQuizPrompt = {
  vocab: KoreanVocab
  questionType: QuizType
  options: string[]
  prompt: string
}

export function QuizQuestion({
  question,
  onAnswer,
  disabled,
  colors,
}: {
  question: MobileQuizPrompt
  onAnswer: (answer: string) => void
  disabled: boolean
  colors: ThemeColors
}) {
  const [value, setValue] = useState('')
  const [selected, setSelected] = useState<string | null>(null)
  const [speaking, setSpeaking] = useState(false)
  const ttsSupported = isTTSSupported()
  useEffect(() => () => stopSpeaking(), [])
  const input = question.questionType === 'fill_blank' || question.questionType === 'typing'
  const submit = () => {
    const answer = input ? value.trim() : selected
    if (answer) onAnswer(answer)
  }
  return (
    <View style={{ gap: 16 }}>
      <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: '700' }}>
        {question.prompt}
      </Text>
      {question.questionType === 'listening' && (
        <TouchableOpacity
          disabled={!ttsSupported}
          onPress={() => {
            speakKorean(question.vocab.korean)
            setSpeaking(true)
          }}
          style={{
            alignSelf: 'flex-start',
            flexDirection: 'row',
            gap: 8,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: colors.cardBorder,
            borderRadius: 12,
            padding: 12,
            opacity: ttsSupported ? 1 : 0.5,
          }}
        >
          <Volume2 size={18} color={colors.textSecondary} />
          <Text style={{ color: colors.textSecondary }}>{speaking ? 'Speaking...' : 'Listen'}</Text>
        </TouchableOpacity>
      )}
      {input ? (
        <TextInput
          value={value}
          onChangeText={setValue}
          onSubmitEditing={submit}
          editable={!disabled}
          placeholder={
            question.questionType === 'typing' ? 'Type Korean or romanization' : 'Type your answer'
          }
          placeholderTextColor={colors.textSecondary}
          style={{
            borderWidth: 1,
            borderColor: colors.cardBorder,
            borderRadius: 12,
            padding: 14,
            color: colors.textPrimary,
          }}
        />
      ) : (
        <View style={{ gap: 10 }}>
          {question.options.map((option) => (
            <TouchableOpacity
              key={option}
              disabled={disabled}
              onPress={() => setSelected(option)}
              style={{
                borderWidth: 1,
                borderColor: selected === option ? colors.accent1 : colors.cardBorder,
                backgroundColor: selected === option ? colors.surface : colors.cardBg,
                borderRadius: 12,
                padding: 14,
              }}
            >
              <Text style={{ color: colors.textPrimary, fontSize: 15 }}>{option}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      <TouchableOpacity
        disabled={disabled || (!value.trim() && !selected)}
        onPress={submit}
        style={{
          backgroundColor: colors.accent1,
          borderRadius: 12,
          padding: 14,
          alignItems: 'center',
          opacity: disabled || (!value.trim() && !selected) ? 0.5 : 1,
        }}
      >
        <Text style={{ color: colors.background, fontWeight: '700' }}>Check answer</Text>
      </TouchableOpacity>
    </View>
  )
}
