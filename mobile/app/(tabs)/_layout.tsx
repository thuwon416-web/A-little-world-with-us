import { Redirect, Tabs } from 'expo-router'
import { Text } from 'react-native'

import { useAdmin } from '@/hooks/useAdmin'
import { useAuth } from '@/lib/auth'

export default function TabsLayout() {
  const { user, loading } = useAuth()
  const { isAdmin, loading: adminLoading } = useAdmin()

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
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => <Text style={{ color, fontSize: size }}>🏠</Text>,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          tabBarIcon: ({ color, size }) => <Text style={{ color, fontSize: size }}>💬</Text>,
        }}
      />
      <Tabs.Screen
        name="location"
        options={{
          title: 'Location',
          href: isAdmin ? undefined : null,
          tabBarIcon: ({ color, size }) => <Text style={{ color, fontSize: size }}>📍</Text>,
        }}
      />
      <Tabs.Screen
        name="care"
        options={{
          title: 'Care',
          tabBarIcon: ({ color, size }) => <Text style={{ color, fontSize: size }}>🌷</Text>,
        }}
      />
      <Tabs.Screen
        name="plans"
        options={{
          title: 'Plans',
          tabBarIcon: ({ color, size }) => <Text style={{ color, fontSize: size }}>📅</Text>,
        }}
      />
      <Tabs.Screen
        name="gallery"
        options={{
          title: 'Gallery',
          tabBarIcon: ({ color, size }) => <Text style={{ color, fontSize: size }}>🖼️</Text>,
        }}
      />
      <Tabs.Screen
        name="wellness"
        options={{
          title: 'Wellness',
          tabBarIcon: ({ color, size }) => <Text style={{ color, fontSize: size }}>❤️</Text>,
        }}
      />
      <Tabs.Screen
        name="ai"
        options={{
          title: 'AI',
          tabBarIcon: ({ color, size }) => <Text style={{ color, fontSize: size }}>✨</Text>,
        }}
      />
      <Tabs.Screen
        name="reminders"
        options={{
          title: 'Reminders',
          tabBarIcon: ({ color, size }) => <Text style={{ color, fontSize: size }}>🔔</Text>,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => <Text style={{ color, fontSize: size }}>⚙️</Text>,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <Text style={{ color, fontSize: size }}>👤</Text>,
        }}
      />
    </Tabs>
  )
}
