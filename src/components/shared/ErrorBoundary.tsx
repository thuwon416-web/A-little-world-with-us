'use client'

import Link from 'next/link'
import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  }

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex min-h-[320px] items-center justify-center p-6">
            <div className="w-full max-w-md rounded-[28px] border border-rose-200 bg-white/80 p-6 text-center shadow-lg">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-rose-100 text-2xl">
                ⚠️
              </div>
              <h2 className="text-xl font-bold text-rose-900">Something went wrong</h2>
              <p className="mt-2 text-sm leading-6 text-stone-600">
                This part of the app could not load. Please retry or return to the dashboard.
              </p>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="rounded-full bg-rose-600 px-5 py-3 text-sm font-medium text-white"
                >
                  Reload
                </button>
                <Link
                  href="/dashboard"
                  className="rounded-full border border-rose-200 bg-white px-5 py-3 text-sm font-medium text-rose-700"
                >
                  Back home
                </Link>
              </div>
            </div>
          </div>
        )
      )
    }

    return this.props.children
  }
}
