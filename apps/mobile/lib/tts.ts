import * as Speech from 'expo-speech'

export function speakKorean(text: string): void {
  Speech.stop()
  Speech.speak(text, {
    language: 'ko-KR',
    rate: 0.85,
    pitch: 1,
  })
}

export function stopSpeaking(): void {
  Speech.stop()
}

export function isTTSSupported(): boolean {
  return true
}
