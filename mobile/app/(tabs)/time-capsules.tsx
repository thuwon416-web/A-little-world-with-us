import { Redirect, useLocalSearchParams } from 'expo-router'

export default function TimeCapsulesRedirect() {
  useLocalSearchParams()
  return <Redirect href="/(tabs)/memories?section=capsules" />
}
