export default function Loading() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.9),_rgba(247,236,239,0.85),_rgba(250,245,242,1))] px-6">
      <div className="absolute inset-0 opacity-30">
        <div className="absolute left-1/4 top-1/4 h-40 w-40 rounded-full bg-rose-200/60 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 h-52 w-52 rounded-full bg-amber-100/70 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md rounded-[28px] border border-rose-200/70 bg-white/70 p-8 text-center shadow-[0_18px_60px_rgba(180,120,130,0.12)] backdrop-blur-xl">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-rose-100 via-white to-rose-200 shadow-inner shadow-rose-200">
          <span className="text-2xl" aria-hidden="true">
            ♥
          </span>
        </div>

        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-rose-100 border-t-rose-500" />

        <div className="space-y-3">
          <p className="text-[10px] uppercase tracking-[0.34em] text-rose-500">A Little World</p>
          <h1 className="text-2xl font-serif text-rose-900">with Us</h1>
          <div className="mx-auto h-2 w-32 overflow-hidden rounded-full bg-rose-100">
            <div className="h-full w-1/2 animate-pulse rounded-full bg-gradient-to-r from-rose-300 via-rose-500 to-rose-300" />
          </div>
          <p className="text-sm text-stone-600">Loading your love story...</p>
        </div>
      </div>
    </main>
  )
}
