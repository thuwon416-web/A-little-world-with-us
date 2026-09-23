import { Check, Copy, ShieldCheck } from 'lucide-react-native'
import { useState } from 'react'
import { Pressable, Text, TextInput, View } from 'react-native'

import { Modal } from '@/components/ui/Modal'
import { useTheme } from '@/context/ThemeContext'
import { useVaultKey } from '@/contexts/VaultKeyContext'
import { generateBackupKeyPhrase } from '@/lib/vault-crypto'

export default function VaultSetupModal({
  visible,
  onClose,
  onReady,
}: {
  visible: boolean
  onClose: () => void
  onReady: () => void
}) {
  const { colors: themeColors } = useTheme()
  const colors = {
    ...themeColors,
    text: themeColors.textPrimary,
    muted: themeColors.textSecondary,
    border: themeColors.cardBorder,
    danger: themeColors.error,
  }
  const { unlockWithPassphrase } = useVaultKey()
  const [step, setStep] = useState(1)
  const [phrase] = useState(() => generateBackupKeyPhrase())
  const [passphrase, setPassphrase] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [error, setError] = useState('')
  return (
    <Modal visible={visible} onClose={onClose} title="Set up Vault Passphrase">
      {step === 1 ? (
        <View>
          <Text style={{ color: colors.muted }}>
            Create an 8+ character passphrase for encrypted passwords.
          </Text>
          <TextInputLike
            value={passphrase}
            onChange={setPassphrase}
            placeholder="Passphrase (8+ characters)"
          />
          <TextInputLike
            value={confirmation}
            onChange={setConfirmation}
            placeholder="Confirm passphrase"
          />
        </View>
      ) : step === 2 ? (
        <View>
          <ShieldCheck size={28} color={colors.accent1} />
          <Text style={{ color: colors.muted }}>
            Save this backup phrase somewhere private. It is the only recovery option.
          </Text>
          <Text style={{ color: colors.text, marginTop: 14, lineHeight: 24 }}>
            {phrase.join(' ')}
          </Text>
          <Pressable onPress={() => void navigator.clipboard?.writeText(phrase.join(' '))}>
            <Copy size={17} color={colors.accent1} />
          </Pressable>
        </View>
      ) : (
        <View>
          <Check size={28} color={colors.success} />
          <Text style={{ color: colors.muted }}>
            Your encrypted password vault is ready. You can use biometrics to unlock it.
          </Text>
        </View>
      )}
      {error ? <Text style={{ color: colors.danger, marginTop: 8 }}>{error}</Text> : null}
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 18 }}>
        {step < 3 ? (
          <Pressable
            onPress={async () => {
              if (step === 1) {
                if (passphrase.length < 8 || passphrase !== confirmation) {
                  setError('Use an 8+ character passphrase and confirm it.')
                  return
                }
                try {
                  await unlockWithPassphrase(passphrase)
                  setStep(2)
                } catch (cause) {
                  setError(cause instanceof Error ? cause.message : 'Unable to set up vault.')
                }
              } else setStep(3)
            }}
          >
            <Text style={{ color: colors.accent1 }}>{step === 1 ? 'Create' : 'I saved it'}</Text>
          </Pressable>
        ) : (
          <Pressable onPress={onReady}>
            <Text style={{ color: colors.accent1 }}>Done</Text>
          </Pressable>
        )}
        <Pressable onPress={step === 3 ? onReady : onClose}>
          <Text style={{ color: colors.muted }}>{step === 3 ? 'Close' : 'Cancel'}</Text>
        </Pressable>
      </View>
    </Modal>
  )
}

function TextInputLike({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (value: string) => void
  placeholder: string
}) {
  const { colors: themeColors } = useTheme()
  const colors = {
    ...themeColors,
    muted: themeColors.textSecondary,
    border: themeColors.cardBorder,
    text: themeColors.textPrimary,
  }
  return (
    <TextInput
      value={value}
      onChangeText={onChange}
      placeholder={placeholder}
      placeholderTextColor={colors.muted}
      secureTextEntry
      style={{
        backgroundColor: colors.surface,
        borderColor: colors.border,
        borderWidth: 1,
        borderRadius: 10,
        color: colors.text,
        padding: 10,
        marginTop: 10,
      }}
    />
  )
}
