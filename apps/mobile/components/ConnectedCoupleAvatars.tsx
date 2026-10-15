import React, { useState } from 'react'
import { View, Image, Text, StyleSheet } from 'react-native'
import { Heart, User } from 'lucide-react-native'
import { useTheme } from '@/context/ThemeContext'

export interface ConnectedCoupleAvatarsProps {
  userAvatarUrl?: string | null
  partnerAvatarUrl?: string | null
  userName?: string | null
  partnerName?: string | null
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showHeartBadge?: boolean
}

const SIZE_CONFIGS = {
  sm: {
    avatarSize: 34,
    overlap: -10,
    badgeSize: 16,
    iconSize: 9,
    borderWidth: 2,
    fontSize: 11,
  },
  md: {
    avatarSize: 44,
    overlap: -14,
    badgeSize: 20,
    iconSize: 11,
    borderWidth: 2,
    fontSize: 14,
  },
  lg: {
    avatarSize: 56,
    overlap: -18,
    badgeSize: 24,
    iconSize: 13,
    borderWidth: 2.5,
    fontSize: 16,
  },
  xl: {
    avatarSize: 72,
    overlap: -22,
    badgeSize: 28,
    iconSize: 15,
    borderWidth: 3,
    fontSize: 20,
  },
}

function AvatarCircle({
  url,
  name,
  fallbackLetter,
  avatarSize,
  borderWidth,
  borderColor,
  bgColor,
  textColor,
  fontSize,
}: {
  url?: string | null
  name?: string | null
  fallbackLetter: string
  avatarSize: number
  borderWidth: number
  borderColor: string
  bgColor: string
  textColor: string
  fontSize: number
}) {
  const [error, setError] = useState(false)

  const hasImage = Boolean(url && !error)

  return (
    <View
      style={[
        styles.avatarWrapper,
        {
          width: avatarSize,
          height: avatarSize,
          borderRadius: avatarSize / 2,
          borderWidth,
          borderColor,
          backgroundColor: bgColor,
        },
      ]}
    >
      {hasImage ? (
        <Image
          source={{ uri: url as string }}
          style={[
            styles.avatarImage,
            {
              width: avatarSize - borderWidth * 2,
              height: avatarSize - borderWidth * 2,
              borderRadius: (avatarSize - borderWidth * 2) / 2,
            },
          ]}
          onError={() => setError(true)}
        />
      ) : (
        <View style={styles.fallbackContainer}>
          {name ? (
            <Text style={[styles.fallbackText, { color: textColor, fontSize }]}>
              {name.charAt(0).toUpperCase()}
            </Text>
          ) : (
            <User size={avatarSize * 0.45} color={textColor} />
          )}
        </View>
      )}
    </View>
  )
}

export function ConnectedCoupleAvatars({
  userAvatarUrl,
  partnerAvatarUrl,
  userName = 'You',
  partnerName = 'Partner',
  size = 'md',
  showHeartBadge = true,
}: ConnectedCoupleAvatarsProps) {
  const { colors } = useTheme()
  const cfg = SIZE_CONFIGS[size]

  return (
    <View style={styles.container}>
      {/* User Avatar (Left) */}
      <View style={{ zIndex: 2 }}>
        <AvatarCircle
          url={userAvatarUrl}
          name={userName}
          fallbackLetter="U"
          avatarSize={cfg.avatarSize}
          borderWidth={cfg.borderWidth}
          borderColor={colors.cardBg}
          bgColor={colors.accent1 + '25'}
          textColor={colors.accent1}
          fontSize={cfg.fontSize}
        />
      </View>

      {/* Floating Center Heart Badge */}
      {showHeartBadge && (
        <View
          style={[
            styles.heartBadge,
            {
              width: cfg.badgeSize,
              height: cfg.badgeSize,
              borderRadius: cfg.badgeSize / 2,
              backgroundColor: colors.cardBg,
              borderColor: colors.cardBorder,
              borderWidth: 1,
              zIndex: 3,
            },
          ]}
        >
          <Heart size={cfg.iconSize} color="#f43f5e" fill="#f43f5e" />
        </View>
      )}

      {/* Partner Avatar (Right, overlapping) */}
      <View style={{ marginLeft: cfg.overlap, zIndex: 1 }}>
        <AvatarCircle
          url={partnerAvatarUrl}
          name={partnerName}
          fallbackLetter="P"
          avatarSize={cfg.avatarSize}
          borderWidth={cfg.borderWidth}
          borderColor={colors.cardBg}
          bgColor={colors.accent2 ? colors.accent2 + '25' : colors.accent1 + '25'}
          textColor={colors.accent2 || colors.accent1}
          fontSize={cfg.fontSize}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  avatarWrapper: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarImage: {
    resizeMode: 'cover',
  },
  fallbackContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackText: {
    fontWeight: '700',
  },
  heartBadge: {
    position: 'absolute',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 4,
  },
})
