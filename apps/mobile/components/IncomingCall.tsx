import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'

import { useTheme } from '@/context/ThemeContext'
import { type CallSignal } from '@/services/call'

export function IncomingCall({
  visible,
  signal,
  onAccept,
  onReject,
}: {
  visible: boolean
  signal: CallSignal | null
  onAccept: () => void
  onReject: () => void
}) {
  const { colors } = useTheme()
  const styles = createStyles(colors)
  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Incoming call</Text>
          <Text style={styles.subtitle}>
            {signal?.type === 'video' ? 'Video call' : 'Audio call'}
          </Text>
          <Text style={styles.caller}>Call from your partner</Text>

          <View style={styles.actions}>
            <Pressable style={[styles.button, styles.acceptButton]} onPress={onAccept}>
              <Text style={styles.buttonText}>Accept</Text>
            </Pressable>
            <Pressable style={[styles.button, styles.rejectButton]} onPress={onReject}>
              <Text style={styles.buttonText}>Decline</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const createStyles = (colors: ReturnType<typeof useTheme>['colors']) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.55)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 24,
      width: '84%',
      padding: 24,
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    title: {
      color: colors.textPrimary,
      fontSize: 24,
      fontWeight: '700',
      marginBottom: 6,
    },
    subtitle: {
      color: colors.accent2,
      fontSize: 14,
      marginBottom: 12,
    },
    caller: {
      color: colors.textPrimary,
      fontSize: 18,
      fontWeight: '600',
      marginBottom: 20,
    },
    actions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 12,
    },
    button: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: 'center',
    },
    acceptButton: {
      backgroundColor: colors.success,
    },
    rejectButton: {
      backgroundColor: colors.error,
    },
    buttonText: {
      color: colors.background,
      fontWeight: '700',
    },
  })
