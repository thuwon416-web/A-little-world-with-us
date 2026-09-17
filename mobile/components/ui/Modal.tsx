import React from 'react'
import { Modal as RNModal, Pressable, StyleSheet, Text } from 'react-native'

import { useTheme } from '@/context/ThemeContext'

interface ModalProps {
  visible: boolean
  onClose: () => void
  title?: string
  children?: React.ReactNode
}

export function Modal({ visible, onClose, title, children }: ModalProps) {
  const { colors } = useTheme()
  return (
    <RNModal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}
          onPress={() => undefined}
        >
          {title ? <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text> : null}
          {children}
        </Pressable>
      </Pressable>
    </RNModal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  container: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
})
