import { Redirect, useLocalSearchParams } from 'expo-router'

export default function GalleryRedirect() {
  useLocalSearchParams()
  return <Redirect href="/(tabs)/memories?section=gallery" />
}
