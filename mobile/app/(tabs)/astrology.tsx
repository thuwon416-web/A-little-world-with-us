import { useState } from 'react'
import { Alert, Text, TouchableOpacity, View } from 'react-native'
import SecondaryPage, { secondaryStyles as s } from '@/components/SecondaryPage'
import { moonPhase } from '@/services/secondary'
import { supabase } from '@/lib/supabase'

const signs = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces']
export default function AstrologyScreen() {
  const [sign, setSign] = useState('Aries'); const [advice, setAdvice] = useState(''); const score = 70 + ((signs.indexOf(sign) * 7) % 29)
  const horoscope = async () => { try { const { data, error } = await supabase.functions.invoke('ai-horoscope', { body: { sign, language: 'my' } }); if (error) throw error; setAdvice(typeof data === 'string' ? data : data?.horoscope ?? data?.advice ?? 'Today is a good day to listen with care.') } catch (caught) { Alert.alert('Horoscope unavailable', caught instanceof Error ? caught.message : 'Please try again.') } }
  return <SecondaryPage title="Astrology"><View style={s.card}><Text style={s.buttonText}>Compatibility</Text><Text style={{ color: '#ff9bba', fontSize: 38, fontWeight: '800' }}>{score}%</Text><Text style={s.muted}>A playful reflection based on your selected sign.</Text></View><View style={s.card}><Text style={s.buttonText}>Your sign</Text><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>{signs.map((item) => <TouchableOpacity key={item} style={[{ backgroundColor: '#2a2d36', padding: 8, borderRadius: 9 }, sign === item && { backgroundColor: '#ff6b81' }]} onPress={() => setSign(item)}><Text style={{ color: '#fff', fontSize: 12 }}>{item}</Text></TouchableOpacity>)}</View><TouchableOpacity style={s.button} onPress={() => void horoscope()}><Text style={s.buttonText}>Get daily horoscope</Text></TouchableOpacity>{advice ? <Text style={s.muted}>{advice}</Text> : null}</View><View style={s.card}><Text style={s.buttonText}>Moon phase</Text><Text style={s.muted}>{moonPhase(new Date())}</Text><Text style={s.muted}>No major retrograde alert is active in this app.</Text></View></SecondaryPage>
}
