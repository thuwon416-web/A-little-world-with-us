import { Text } from 'react-native'
import SecondaryPage, { secondaryStyles as s } from '@/components/SecondaryPage'
export default function AboutScreen() { return <SecondaryPage title="About"><Text style={s.muted}>A Little World With Us is a private shared space for couples to connect, care, plan, and remember.</Text><Text style={s.muted}>Native app · Version 1.0.0</Text><Text style={s.muted}>Built for gentle everyday connection.</Text></SecondaryPage> }
