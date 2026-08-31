import { StyleSheet, TextInput, TextInputProps } from 'react-native';

export function Input(props: TextInputProps) {
  return (
    <TextInput
      {...props}
      placeholderTextColor="#8d8d99"
      style={[styles.input, props.style]}
      autoCapitalize="sentences"
      autoCorrect={false}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: '#171b22',
    borderColor: '#2a2d35',
    borderWidth: 1,
    borderRadius: 12,
    color: '#f3f0f5',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
});
