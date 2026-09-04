'use client'

import { useState, useEffect } from 'react'
import { Battery, Wifi, Signal, Smartphone } from 'lucide-react'

interface BatteryStatusProps {
  userId?: string
  partnerData?: {
    batteryLevel?: number
    isCharging?: boolean
    networkType?: string
    signalStrength?: number
  }
}

export default function BatteryStatus({ userId, partnerData }: BatteryStatusProps) {
  const [batteryInfo, setBatteryInfo] = useState<{
    level: number
    charging: boolean
  } | null>(null)
  const [networkInfo, setNetworkInfo] = useState<{
    type: string
    strength: number
  } | null>(null)

  useEffect(() => {
    // Try to get battery info from Battery API
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        setBatteryInfo({
          level: Math.round(battery.level * 100),
          charging: battery.charging,
        })

        battery.addEventListener('levelchange', () => {
          setBatteryInfo({
            level: Math.round(battery.level * 100),
            charging: battery.charging,
          })
        })

        battery.addEventListener('chargingchange', () => {
          setBatteryInfo({
            level: Math.round(battery.level * 100),
            charging: battery.charging,
          })
        })
      })
    }

    // Try to get network info from Network Information API
    if ('connection' in navigator) {
      const connection = (navigator as any).connection
      setNetworkInfo({
        type: connection.effectiveType || 'unknown',
        strength: connection.downlink || 0,
      })

      connection.addEventListener('change', () => {
        setNetworkInfo({
          type: connection.effectiveType || 'unknown',
          strength: connection.downlink || 0,
        })
      })
    }
  }, [])

  // Use partner data if available (from database)
  const displayBattery = partnerData?.batteryLevel !== undefined
    ? partnerData.batteryLevel
    : batteryInfo?.level
  const displayCharging = partnerData?.isCharging !== undefined
    ? partnerData.isCharging
    : batteryInfo?.charging
  const displayNetwork = partnerData?.networkType || networkInfo?.type
  const displaySignal = partnerData?.signalStrength || networkInfo?.strength

  const getBatteryColor = (level: number) => {
    if (level > 50) return 'text-green-500'
    if (level > 20) return 'text-yellow-500'
    return 'text-red-500'
  }

  const getNetworkIcon = (type: string) => {
    switch (type) {
      case 'wifi':
        return <Wifi className="h-4 w-4" />
      case 'cellular':
      case '4g':
        return <Signal className="h-4 w-4" />
      default:
        return <Smartphone className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-3">
      {/* Battery Status */}
      <div className="rounded-xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)] p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-[var(--accent-1)]/15 p-2 text-[var(--accent-1)]">
              <Battery className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-[var(--text-secondary)]">Battery</p>
              {displayBattery !== undefined ? (
                <p className={`text-lg font-semibold ${getBatteryColor(displayBattery)}`}>
                  {displayBattery}%
                </p>
              ) : (
                <p className="text-sm text-[var(--text-secondary)]">Not available</p>
              )}
            </div>
          </div>
          {displayCharging !== undefined && (
            <div className={`flex items-center gap-1 text-xs font-medium ${
              displayCharging ? 'text-green-500' : 'text-[var(--text-secondary)]'
            }`}>
              {displayCharging ? (
                <>
                  <Battery className="h-3 w-3 animate-pulse" />
                  <span>Charging</span>
                </>
              ) : (
                <>
                  <Battery className="h-3 w-3" />
                  <span>Discharging</span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Battery Bar */}
        {displayBattery !== undefined && (
          <div className="relative h-2 w-full overflow-hidden rounded-full bg-[var(--accent-1)]/10">
            <div
              className={`absolute inset-y-0 left-0 rounded-full transition-all ${
                displayBattery > 50 ? 'bg-green-500' : displayBattery > 20 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${displayBattery}%` }}
            />
          </div>
        )}
      </div>

      {/* Network Status */}
      <div className="rounded-xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)] p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-[var(--accent-1)]/15 p-2 text-[var(--accent-1)]">
              {displayNetwork ? getNetworkIcon(displayNetwork) : <Signal className="h-5 w-5" />}
            </div>
            <div>
              <p className="text-xs text-[var(--text-secondary)]">Network</p>
              <p className="text-sm font-medium text-[var(--text-primary)] capitalize">
                {displayNetwork || 'Unknown'}
              </p>
            </div>
          </div>
          {displaySignal !== undefined && (
            <div className="text-right">
              <p className="text-xs text-[var(--text-secondary)]">Signal</p>
              <p className="text-sm font-medium text-[var(--text-primary)]">
                {displaySignal} Mbps
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Device Info */}
      <div className="rounded-xl border border-[var(--accent-1)]/20 bg-[var(--card-bg)] p-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-[var(--accent-1)]/15 p-2 text-[var(--accent-1)]">
            <Smartphone className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-[var(--text-secondary)]">Device</p>
            <p className="text-sm font-medium text-[var(--text-primary)]">
              {userId ? 'Partner Device' : 'Your Device'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
