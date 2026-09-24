'use client'

import { Phone, Video } from 'lucide-react'

export default function CallsPage() {
  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs uppercase tracking-[0.22em] text-text-2">Calls</p>
        <h1 className="mt-2 text-3xl font-serif text-text-1">Stay close, even apart</h1>
      </header>

      <section className="max-w-2xl rounded-[30px] border border-accent-1/20 bg-card p-6">
        <h2 className="text-xl font-semibold text-text-1">Calling from the web is not available</h2>
        <p className="mt-3 text-sm leading-6 text-text-2">
          The mobile app can send and accept a call request. Live audio and video are not connected yet.
          This page does not place a pretend call or show sample call history.
        </p>
        <div className="mt-5 flex flex-wrap gap-3 text-sm text-text-2">
          <span className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-2">
            <Phone className="h-4 w-4" /> Audio request on mobile
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-2">
            <Video className="h-4 w-4" /> Video request on mobile
          </span>
        </div>
      </section>
    </div>
  )
}
