import { Redirect, useLocalSearchParams } from 'expo-router'

export default function MemoryMapRedirect() {
  useLocalSearchParams()
  return <Redirect href="/(tabs)/memories?section=map" />
}
