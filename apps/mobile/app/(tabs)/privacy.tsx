import { Text, View } from 'react-native'

import SecondaryPage, { secondaryStyles as s } from '@/components/SecondaryPage'

export default function PrivacyScreen() {
  return (
    <SecondaryPage title="Privacy Policy" eyebrow="LEGAL">
      <View style={s.card}>
        <Text style={s.muted}>Version: 1.0</Text>
        <Text style={s.muted}>Effective Date: September 12, 2026</Text>
        <Text style={s.muted}>Last Updated: September 12, 2026</Text>
      </View>
      <View style={s.card}>
        <Text style={s.buttonText}>1. Data Collection</Text>
        <Text style={s.muted}>
          We collect only essential data to provide app functionality: memories, messages, settings,
          and couple preferences. We do not collect unnecessary personal information.
        </Text>
      </View>
      <View style={s.card}>
        <Text style={s.buttonText}>2. Data Usage</Text>
        <Text style={s.muted}>
          Your data is used solely to provide app functionality and improve your experience. We do
          not sell, rent, or share your personal data with third parties for marketing purposes.
        </Text>
      </View>
      <View style={s.card}>
        <Text style={s.buttonText}>3. Data Security</Text>
        <Text style={s.muted}>
          Data is encrypted in transit and at rest using industry-standard security practices.
          Couple-scoped access protects shared content.
        </Text>
      </View>
      <View style={s.card}>
        <Text style={s.buttonText}>4. Your Rights</Text>
        <Text style={s.muted}>
          You can access, export, or delete available data from Settings, update your preferences,
          and control what information is shared.
        </Text>
      </View>
      <View style={s.card}>
        <Text style={s.buttonText}>5. Location and Local Data</Text>
        <Text style={s.muted}>
          Location sharing is opt-in and can be disabled at any time. Device storage may be used for
          session and preference data.
        </Text>
      </View>
      <View style={s.card}>
        <Text style={s.buttonText}>6. Third-Party Services</Text>
        <Text style={s.muted}>
          We may use Supabase for authentication and storage and third-party services for AI
          features. Those services have their own privacy policies.
        </Text>
      </View>
      <View style={s.card}>
        <Text style={s.buttonText}>7. AI Features</Text>
        <Text style={s.muted}>
          AI features process only the data you choose to submit for that feature. AI requests are
          not intended to provide unrestricted access to your private couple data.
        </Text>
      </View>
      <View style={s.card}>
        <Text style={s.buttonText}>8. Data Retention</Text>
        <Text style={s.muted}>
          We retain account data while your account is active or as needed to provide the service.
          Export or delete available data from Settings, subject to security or legal obligations.
        </Text>
      </View>
      <View style={s.card}>
        <Text style={s.buttonText}>9. Contact</Text>
        <Text style={s.muted}>For privacy questions, contact privacy@alittleworldwithus.com.</Text>
      </View>
    </SecondaryPage>
  )
}
