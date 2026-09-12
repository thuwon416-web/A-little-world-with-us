export default function PrivateLoading() {
  return (
    <main className="space-y-4 p-4" aria-label="Loading page">
      <div className="h-8 w-40 animate-pulse rounded-full bg-[var(--card-bg-strong)]" />
      <div className="h-64 animate-pulse rounded-3xl bg-[var(--card-bg-strong)]" />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="h-40 animate-pulse rounded-3xl bg-[var(--card-bg-strong)]" />
        <div className="h-40 animate-pulse rounded-3xl bg-[var(--card-bg-strong)]" />
      </div>
      <p className="sr-only">Loading your private page</p>
    </main>
  )
}
