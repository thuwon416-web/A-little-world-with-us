import { useRouter } from 'expo-router'
import { Text, TouchableOpacity, View } from 'react-native'

import SecondaryPage, { secondaryStyles as s } from '@/components/SecondaryPage'

export default function HelpScreen() {
  const router = useRouter()

  return (
    <SecondaryPage title="Help Center" eyebrow="SUPPORT">
      <View style={s.card}>
        <Text style={s.buttonText}>How do I link my partner?</Text>
        <Text style={s.muted}>
          Open Couple Linking, enter the invitation code, and accept the pending link.
        </Text>
      </View>
      <View style={s.card}>
        <Text style={s.buttonText}>How do I export my data?</Text>
        <Text style={s.muted}>
          Open Settings and choose an export option. The native share sheet will let you save or
          send it.
        </Text>
      </View>
      <View style={s.card}>
        <Text style={s.buttonText}>Need more help?</Text>
        <Text style={s.muted}>
          Contact support at support@alittleworldwithus.com and include the screen where you need
          assistance.
        </Text>
      </View>
      <View style={s.card}>
        <Text style={s.buttonText}>Troubleshooting</Text>
        <Text style={s.muted}>
          Cannot log in? Check your connection, confirm your email, and try the password reset flow.
        </Text>
        <Text style={s.muted}>
          Cannot link with your partner? Confirm both accounts are registered and the invite has not
          expired.
        </Text>
        <Text style={s.muted}>
          App is slow or not loading? Refresh the app, check your connection, and try again.
        </Text>
        <Text style={s.muted}>
          Notifications not working? Review notification permissions in Settings and device
          settings.
        </Text>
        <Text style={s.muted}>
          Location not sharing? Confirm location permission and partner sharing are enabled.
        </Text>
        <Text style={s.muted}>
          AI not responding? Check your connection, submit a shorter request, and try again.
        </Text>
      </View>
      <View style={s.card}>
        <Text style={s.buttonText}>Legal and App Information</Text>
        <TouchableOpacity style={s.button} onPress={() => router.push('/about')}>
          <Text style={s.buttonText}>About</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.button} onPress={() => router.push('/privacy')}>
          <Text style={s.buttonText}>Privacy Policy</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.button} onPress={() => router.push('/terms')}>
          <Text style={s.buttonText}>Terms of Service</Text>
        </TouchableOpacity>
      </View>
    </SecondaryPage>
  )
}
