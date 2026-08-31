import { Pressable, StyleSheet, Text } from 'react-native'

interface ButtonProps {
  title: string
  onPress: () => void
}

export function Button({ title, onPress }: ButtonProps) {
  return (
    <Pressable onPress={onPress} style={styles.button}>
      <Text style={styles.text}>{title}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#b88ae5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  text: {
    color: '#110d1a',
    fontWeight: '700',
    fontSize: 14,
  },
})
