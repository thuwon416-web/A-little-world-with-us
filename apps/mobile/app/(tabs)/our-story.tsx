import { Redirect, useLocalSearchParams } from 'expo-router'

export default function OurStoryRedirect() {
  useLocalSearchParams()
  return <Redirect href="/(tabs)/memories?section=story" />
}
