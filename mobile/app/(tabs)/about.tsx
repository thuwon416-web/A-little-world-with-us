import { useRouter } from 'expo-router'
import { Text, TouchableOpacity, View } from 'react-native'

import appConfig from '../../app.json'

import SecondaryPage, { secondaryStyles as s } from '@/components/SecondaryPage'

export default function AboutScreen() {
  const router = useRouter()
  const version = appConfig.expo.version

  return (
    <SecondaryPage title="About">
      <Text style={s.muted}>
        A Little World With Us is a private relationship app designed to help couples celebrate
        their love, preserve memories, and build meaningful rituals together.
      </Text>
      <View style={s.card}>
        <Text style={s.buttonText}>App Information</Text>
        <Text style={s.muted}>App Name: A Little World With Us</Text>
        <Text style={s.muted}>Version: {version}</Text>
        <Text style={s.muted}>Platform: Android (Native)</Text>
        <Text style={s.muted}>Last Updated: September 12, 2026</Text>
      </View>
      <View style={s.card}>
        <Text style={s.buttonText}>Support</Text>
        <Text style={s.muted}>support@alittleworldwithus.com</Text>
        <TouchableOpacity style={s.button} onPress={() => router.push('/help')}>
          <Text style={s.buttonText}>Visit Help & FAQ</Text>
        </TouchableOpacity>
      </View>
      <View style={s.card}>
        <Text style={s.buttonText}>Frequently Asked Questions</Text>
        <Text style={s.muted}>How do I link with my partner?</Text>
        <Text style={s.muted}>
          Use Couple Linking and share the invitation code with your partner.
        </Text>
        <Text style={s.muted}>How is my data secured?</Text>
        <Text style={s.muted}>Authenticated, couple-scoped access protects shared content.</Text>
        <Text style={s.muted}>Does AI read my messages?</Text>
        <Text style={s.muted}>AI features process only data you choose to submit.</Text>
        <Text style={s.muted}>Can I export my data?</Text>
        <Text style={s.muted}>Use the Export option in Settings.</Text>
        <Text style={s.muted}>How do I delete my account?</Text>
        <Text style={s.muted}>
          Review account-management options in Settings or contact support.
        </Text>
        <Text style={s.muted}>What happens if we unlink?</Text>
        <Text style={s.muted}>
          Shared couple access ends, while account data remains subject to the Privacy Policy.
        </Text>
      </View>
      <Text style={s.muted}>Built for gentle everyday connection.</Text>
    </SecondaryPage>
  )
}
