'use client'

import { useEffect, useRef } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import {
  Phone,
  Video,
  PhoneOff,
  Mic,
  MicOff,
  VideoOff,
  PhoneCall,
  Clock,
  Heart,
} from 'lucide-react'
import { useWebCall } from '@/hooks/useWebCall'

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

export default function CallsPage() {
  const { t } = useLanguage()
  const {
    partnerId,
    partnerName,
    callStatus,
    callType,
    localStream,
    remoteStream,
    isMuted,
    isVideoDisabled,
    duration,
    startCall,
    answerCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleVideo,
  } = useWebCall()

  const localVideoRef = useRef<HTMLVideoElement | null>(null)
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null)

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream
    }
  }, [localStream])

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream
    }
  }, [remoteStream])

  return (
    <div className="space-y-6 animate-fade-in">
      <header>
        <p className="text-xs uppercase tracking-[0.22em] text-text-2">{t('Calls.title')}</p>
        <h1 className="mt-2 text-3xl font-serif text-text-1">{t('Calls.subtitle')}</h1>
      </header>

      {/* Ringing (Incoming Call Modal/Banner) */}
      {callStatus === 'ringing' && (
        <section className="max-w-xl rounded-panel border-2 border-accent-1/50 bg-card p-6 shadow-xl animate-bounce-subtle">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-1/20 text-accent-1 animate-pulse">
              <PhoneCall className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-bold text-text-1">{t('Calls.incomingCall').replace('{name}', partnerName)}</h2>
              <p className="text-sm text-text-2">
                {callType === 'video' ? t('Calls.incomingVideo') : t('Calls.incomingAudio')}
              </p>
            </div>
          </div>
          <div className="mt-5 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => void rejectCall()}
              className="inline-flex items-center gap-2 min-h-11 rounded-xl bg-error/15 px-4 py-2.5 text-sm font-semibold text-error hover:bg-error/25 active:scale-95"
            >
              <PhoneOff className="h-4 w-4" /> Decline
            </button>
            <button
              type="button"
              onClick={() => void answerCall()}
              className="inline-flex items-center gap-2 min-h-11 rounded-xl bg-success px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:opacity-90 active:scale-95"
            >
              <Phone className="h-4 w-4" /> Answer
            </button>
          </div>
        </section>
      )}

      {/* In-Call Active Stage */}
      {(callStatus === 'in_call' || callStatus === 'calling') && (
        <section className="relative overflow-hidden rounded-panel border border-accent-1/20 bg-card p-6 shadow-2xl">
          <div className="flex items-center justify-between border-b border-border/50 pb-4">
            <div>
              <span className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-accent-1 font-semibold">
                <Heart className="h-3.5 w-3.5 fill-current animate-pulse" />
                {callStatus === 'calling' ? t('Calls.calling') : t('Calls.connected')}
              </span>
              <h2 className="text-2xl font-serif text-text-1">{partnerName}</h2>
            </div>
            {callStatus === 'in_call' && (
              <div className="inline-flex items-center gap-1.5 rounded-full bg-accent-1/10 px-3 py-1 text-sm font-medium text-accent-1">
                <Clock className="h-3.5 w-3.5" />
                <span>{formatDuration(duration)}</span>
              </div>
            )}
          </div>

          {/* Video Stage */}
          <div className="relative mt-6 min-h-[320px] max-h-[500px] aspect-video w-full overflow-hidden rounded-2xl bg-black/90 flex items-center justify-center">
            {callType === 'video' && remoteStream ? (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="h-full w-full object-cover"
              />
            ) : callType === 'video' && localStream ? (
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="h-full w-full object-cover scale-x-[-1]"
              />
            ) : (
              <div className="flex flex-col items-center gap-3 text-white/80">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-accent-1/25 text-accent-1 text-2xl font-bold">
                  {partnerName.slice(0, 1)}
                </div>
                <p className="text-lg font-medium">
                  {callStatus === 'calling' ? t('Calls.callingWith').replace('{name}', partnerName) : t('Calls.connectedWith').replace('{name}', partnerName)}
                </p>
              </div>
            )}

            {/* Picture-in-picture local preview for video call */}
            {callType === 'video' && localStream && remoteStream && (
              <div className="absolute bottom-4 right-4 h-32 w-44 overflow-hidden rounded-xl border-2 border-white/30 shadow-lg bg-black">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="h-full w-full object-cover scale-x-[-1]"
                />
              </div>
            )}
          </div>

          {/* In-Call Controls */}
          <div className="mt-6 flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={toggleMute}
              className={`flex h-12 w-12 items-center justify-center rounded-full border transition active:scale-95 ${
                isMuted
                  ? 'border-error/40 bg-error/15 text-error'
                  : 'border-border bg-card/70 text-text-1 hover:bg-card'
              }`}
              title={isMuted ? t('Calls.unmute') : t('Calls.mute')} aria-label={isMuted ? t('Calls.unmute') : t('Calls.mute')}
            >
              {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </button>

            {callType === 'video' && (
              <button
                type="button"
                onClick={toggleVideo}
                className={`flex h-12 w-12 items-center justify-center rounded-full border transition active:scale-95 ${
                  isVideoDisabled
                    ? 'border-error/40 bg-error/15 text-error'
                    : 'border-border bg-card/70 text-text-1 hover:bg-card'
                }`}
                title={isVideoDisabled ? t('Calls.enableCamera') : t('Calls.disableCamera')} aria-label={isVideoDisabled ? t('Calls.enableCamera') : t('Calls.disableCamera')}
              >
                {isVideoDisabled ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
              </button>
            )}

            <button
              type="button"
              onClick={() => void endCall()}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-error text-white shadow-lg transition hover:opacity-90 active:scale-95"
              title={t('Calls.endCall')} aria-label={t('Calls.endCall')}
            >
              <PhoneOff className="h-5 w-5" />
            </button>
          </div>
        </section>
      )}

      {/* Idle / Call Options */}
      {callStatus === 'idle' && (
        <section className="max-w-2xl rounded-panel border border-accent-1/20 bg-card p-6 shadow-sm">
          <h2 className="text-xl font-serif text-text-1">{t('Calls.callWithPartner')}</h2>
          <p className="mt-2 text-sm text-text-2">
            {t('Calls.callDescription')}
          </p>

          <div className="mt-6 flex flex-wrap gap-4">
            <button
              type="button"
              disabled={!partnerId}
              onClick={() => void startCall('audio')}
              className="inline-flex items-center gap-2 min-h-11 rounded-xl bg-accent-1 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Phone className="h-4 w-4" /> Start Audio Call
            </button>

            <button
              type="button"
              disabled={!partnerId}
              onClick={() => void startCall('video')}
              className="inline-flex items-center gap-2 min-h-11 rounded-xl border border-accent-1/30 bg-accent-1/10 px-5 py-3 text-sm font-semibold text-text-1 transition hover:bg-accent-1/20 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Video className="h-4 w-4" /> Start Video Call
            </button>
          </div>

          {!partnerId && (
            <p className="mt-4 text-xs text-warning">
              {t('Calls.linkPartnerFirst')}
            </p>
          )}
        </section>
      )}
    </div>
  )
}
