'use client'

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.85),_rgba(244,214,219,0.75),_rgba(250,245,242,1))] px-6 py-10">
      <div className="w-full max-w-lg rounded-[32px] border border-rose-200/70 bg-white/80 p-8 text-center shadow-[0_18px_60px_rgba(180,120,130,0.15)] backdrop-blur-xl">
        <div className="text-7xl font-serif text-rose-300">404</div>
        <h2 className="mt-4 text-3xl font-serif text-rose-900">This page wandered off</h2>
        <p className="mt-3 text-base leading-7 text-stone-600">
          The page you&apos;re looking for is not here, but your little world still has a place for
          you.
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="rounded-full bg-rose-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-rose-700"
          >
            Go back
          </button>
          <a
            href="/dashboard"
            className="rounded-full border border-rose-200 bg-white px-5 py-3 text-sm font-medium text-rose-700 transition hover:border-rose-300 hover:bg-rose-50"
          >
            Go to dashboard
          </a>
        </div>
      </div>
    </main>
  )
}
