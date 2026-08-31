import React from 'react'
import { Modal as RNModal, Pressable, StyleSheet, Text, View } from 'react-native'
import { designTokens } from '@/design-tokens'

interface ModalProps {
  visible: boolean
  onClose: () => void
  title?: string
  children?: React.ReactNode
}

export function Modal({ visible, onClose, title, children }: ModalProps) {
  return (
    <RNModal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.container} onPress={() => undefined}>
          {title ? <Text style={styles.title}>{title}</Text> : null}
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
    backgroundColor: designTokens.colors.surface,
    borderRadius: designTokens.radii.lg,
    borderWidth: 1,
    borderColor: designTokens.colors.border,
    padding: designTokens.spacing.xl,
  },
  title: {
    color: designTokens.colors.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: designTokens.spacing.md,
  },
})
