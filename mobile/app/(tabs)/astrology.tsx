import { useEffect, useState } from 'react'
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

import SecondaryPage, { secondaryStyles as s } from '@/components/SecondaryPage'
import { useTheme } from '@/context/ThemeContext'
import type { ThemeColors } from '@/context/ThemeContext'
import { sizes, type Sizes } from '@/design-tokens'
import { supabase } from '@/lib/supabase'
import { calculateSynastry, createAstrologyProfile } from '@/services/astrology'
import { moonPhase } from '@/services/secondary'

const signs = [
  'Aries',
  'Taurus',
  'Gemini',
  'Cancer',
  'Leo',
  'Virgo',
  'Libra',
  'Scorpio',
  'Sagittarius',
  'Capricorn',
  'Aquarius',
  'Pisces',
]
export default function AstrologyScreen() {
  const { colors } = useTheme()
  const styles = createStyles(colors, sizes)
  const [sign, setSign] = useState('Aries')
  const [advice, setAdvice] = useState('')
  const [score, setScore] = useState<number | null>(null)
  useEffect(() => {
    const loadCompatibility = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return
      const { data: link } = await supabase
        .from('couple_links')
        .select('inviter_id,accepted_by')
        .or(`inviter_id.eq.${user.id},accepted_by.eq.${user.id}`)
        .eq('status', 'accepted')
        .maybeSingle()
      if (!link?.inviter_id || !link.accepted_by) return
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id,birth_date')
        .in('id', [link.inviter_id, link.accepted_by])
      const dates = (profiles ?? [])
        .map((profile) => profile.birth_date)
        .filter((birthDate): birthDate is string => Boolean(birthDate))
        .map((birthDate) => new Date(`${birthDate}T12:00:00`))
      if (dates.length !== 2 || dates.some((date) => Number.isNaN(date.getTime()))) return
      setScore(
        calculateSynastry(createAstrologyProfile(dates[0]), createAstrologyProfile(dates[1]))
      )
    }
    void loadCompatibility()
  }, [])
  const horoscope = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('ai-horoscope', {
        body: { sign, language: 'my' },
      })
      if (error) throw error
      setAdvice(
        typeof data === 'string'
          ? data
          : (data?.horoscope ?? data?.advice ?? 'Today is a good day to listen with care.')
      )
    } catch (caught) {
      Alert.alert(
        'Horoscope unavailable',
        caught instanceof Error ? caught.message : 'Please try again.'
      )
    }
  }
  return (
    <SecondaryPage title="Astrology">
      <Text style={s.muted}>
        For entertainment only. Astrology is not medical, financial, or relationship advice.
      </Text>
      <View style={s.card}>
        <Text style={s.buttonText}>Compatibility</Text>
        <Text style={{ color: colors.accent1, fontSize: 38, fontWeight: '800' }}>
          {score ?? '—'}%
        </Text>
        <Text style={s.muted}>Based on both partners&apos; saved birth dates.</Text>
      </View>
      <View style={s.card}>
        <Text style={s.buttonText}>Your sign</Text>
        <View style={styles.signGrid}>
          {signs.map((item) => (
            <TouchableOpacity
              key={item}
              style={[styles.signButton, sign === item && styles.signButtonActive]}
              onPress={() => setSign(item)}
            >
              <Text style={[styles.signText, sign === item ? styles.signTextActive : undefined]}>
                {item}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={s.button} onPress={() => void horoscope()}>
          <Text style={s.buttonText}>Get daily horoscope</Text>
        </TouchableOpacity>
        {advice ? <Text style={s.muted}>{advice}</Text> : null}
      </View>
      <View style={s.card}>
        <Text style={s.buttonText}>Moon phase</Text>
        <Text style={s.muted}>{moonPhase(new Date())}</Text>
        <Text style={s.muted}>No major retrograde alert is active in this app.</Text>
      </View>
    </SecondaryPage>
  )
}

const createStyles = (colors: ThemeColors, sizes: Sizes) =>
  StyleSheet.create({
    signGrid: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: 7 },
    signButton: {
      backgroundColor: colors.cardBorder,
      padding: 8,
      borderRadius: sizes.radius.input,
    },
    signButtonActive: { backgroundColor: colors.accent1 },
    signText: { color: colors.background, fontSize: sizes.text.xs },
    signTextActive: { color: colors.background, fontWeight: '700' as const },
  })
