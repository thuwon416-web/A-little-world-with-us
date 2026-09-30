import { Text, View } from 'react-native'

import SecondaryPage, { secondaryStyles as s } from '@/components/SecondaryPage'

export default function TermsScreen() {
  return (
    <SecondaryPage title="Terms of Service" eyebrow="LEGAL">
      <View style={s.card}>
        <Text style={s.muted}>Version: 1.0</Text>
        <Text style={s.muted}>Effective Date: September 12, 2026</Text>
      </View>
      <View style={s.card}>
        <Text style={s.buttonText}>1. Acceptance of Terms</Text>
        <Text style={s.muted}>
          By using A Little World With Us, you agree to these terms and our Privacy Policy.
        </Text>
      </View>
      <View style={s.card}>
        <Text style={s.buttonText}>2. User Responsibilities</Text>
        <Text style={s.muted}>
          Keep your account credentials secure and use the app respectfully with information you
          have the right to share.
        </Text>
      </View>
      <View style={s.card}>
        <Text style={s.buttonText}>3. Service Description</Text>
        <Text style={s.muted}>
          A Little World With Us is a private relationship app that helps couples communicate,
          preserve memories, plan shared activities, and manage relationship-focused content.
        </Text>
      </View>
      <View style={s.card}>
        <Text style={s.buttonText}>4. Content Ownership</Text>
        <Text style={s.muted}>
          You retain ownership of content you upload, including memories, photos, messages, and
          shared plans. We do not claim ownership of your personal data.
        </Text>
      </View>
      <View style={s.card}>
        <Text style={s.buttonText}>5. Privacy and Data</Text>
        <Text style={s.muted}>
          Please review our Privacy Policy to understand how we collect, use, and protect your data.
        </Text>
      </View>
      <View style={s.card}>
        <Text style={s.buttonText}>6. Prohibited Uses</Text>
        <Text style={s.muted}>
          Do not misuse the service, attempt unauthorized access, interfere with its operation,
          upload unlawful or harmful content, or violate another person&apos;s rights.
        </Text>
      </View>
      <View style={s.card}>
        <Text style={s.buttonText}>7. Termination</Text>
        <Text style={s.muted}>
          We may suspend or terminate accounts that violate these terms or engage in prohibited
          activities.
        </Text>
      </View>
      <View style={s.card}>
        <Text style={s.buttonText}>8. Limitation of Liability</Text>
        <Text style={s.muted}>
          To the extent permitted by law, the service is provided as available and we are not liable
          for indirect, incidental, or consequential losses from its use.
        </Text>
      </View>
      <View style={s.card}>
        <Text style={s.buttonText}>9. Governing Law</Text>
        <Text style={s.muted}>
          These terms are governed by the laws applicable in the jurisdiction where the service
          operator is established, without regard to conflict-of-law principles.
        </Text>
      </View>
      <View style={s.card}>
        <Text style={s.buttonText}>10. Changes to Terms</Text>
        <Text style={s.muted}>
          We may update these terms from time to time. Continued use of the service constitutes
          acceptance of changes.
        </Text>
      </View>
      <View style={s.card}>
        <Text style={s.buttonText}>11. Contact</Text>
        <Text style={s.muted}>
          For questions about these terms, contact legal@alittleworldwithus.com.
        </Text>
      </View>
    </SecondaryPage>
  )
}
