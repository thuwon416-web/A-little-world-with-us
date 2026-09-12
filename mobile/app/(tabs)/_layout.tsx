import * as QuickActions from 'expo-quick-actions'
import { useQuickActionRouting } from 'expo-quick-actions/router'
import { Redirect, Tabs } from 'expo-router'
import { Heart, Home, MessageCircle, MoreHorizontal, Sparkles } from 'lucide-react-native'
import { useEffect } from 'react'

import { useAdmin } from '@/hooks/useAdmin'
import { useAuth } from '@/lib/auth'

export default function TabsLayout() {
  const { user, loading } = useAuth()
  const { loading: adminLoading } = useAdmin()
  useQuickActionRouting()
  useEffect(() => {
    void QuickActions.setItems([
      { id: 'love-note', title: 'Send Love Note', icon: 'love', params: { href: '/chat' } },
      { id: 'log-mood', title: 'Log Mood', icon: 'compose', params: { href: '/care' } },
      { id: 'calendar', title: 'View Calendar', icon: 'date', params: { href: '/calendar' } },
      { id: 'timer', title: 'Start Timer', icon: 'time', params: { href: '/wellness' } },
    ])
  }, [])

  if (loading || adminLoading) {
    return null
  }

  if (!user) {
    return <Redirect href="/login" />
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#ff6b81',
        tabBarInactiveTintColor: '#888',
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#1a1a1f',
          borderTopColor: '#2a2a2f',
          borderTopWidth: 1,
          height: 72,
          paddingBottom: 10,
          paddingTop: 8,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarAccessibilityLabel: 'Home tab',
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          tabBarAccessibilityLabel: 'Chat tab',
          tabBarIcon: ({ color, size }) => <MessageCircle color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="care"
        options={{
          title: 'Care',
          tabBarAccessibilityLabel: 'Care tab',
          tabBarIcon: ({ color, size }) => <Sparkles color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="gallery"
        options={{
          title: 'Memories',
          tabBarAccessibilityLabel: 'Memories tab',
          tabBarIcon: ({ color, size }) => <Heart color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'More',
          tabBarAccessibilityLabel: 'More tab',
          tabBarIcon: ({ color, size }) => <MoreHorizontal color={color} size={size} />,
        }}
      />
      <Tabs.Screen name="plans" options={{ href: null }} />
      <Tabs.Screen name="location" options={{ href: null }} />
      <Tabs.Screen name="wellness" options={{ href: null }} />
      <Tabs.Screen name="ai" options={{ href: null }} />
      <Tabs.Screen name="reminders" options={{ href: null }} />
      <Tabs.Screen name="settings" options={{ href: null }} />
      <Tabs.Screen name="profile" options={{ href: null }} />
      <Tabs.Screen name="music" options={{ href: null }} />
      <Tabs.Screen name="finance" options={{ href: null }} />
      <Tabs.Screen name="memories" options={{ href: null }} />
      <Tabs.Screen name="calendar" options={{ href: null }} />
      <Tabs.Screen name="lists" options={{ href: null }} />
      <Tabs.Screen name="vault" options={{ href: null }} />
      <Tabs.Screen name="astrology" options={{ href: null }} />
      <Tabs.Screen name="games" options={{ href: null }} />
      <Tabs.Screen name="time-capsules" options={{ href: null }} />
      <Tabs.Screen name="calls" options={{ href: null }} />
      <Tabs.Screen name="couple-linking" options={{ href: null }} />
      <Tabs.Screen name="privacy" options={{ href: null }} />
      <Tabs.Screen name="help" options={{ href: null }} />
      <Tabs.Screen name="about" options={{ href: null }} />
      <Tabs.Screen name="terms" options={{ href: null }} />
      <Tabs.Screen name="watch-together" options={{ href: null }} />
    </Tabs>
  )
}
