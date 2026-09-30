export default function PrivateLoading() {
  return (
    <div className="space-y-4 p-4" aria-label="Loading page">
      <div className="h-8 w-40 animate-pulse rounded-full bg-card" />
      <div className="h-64 animate-pulse rounded-panel bg-card" />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="h-40 animate-pulse rounded-panel bg-card" />
        <div className="h-40 animate-pulse rounded-panel bg-card" />
      </div>
      <p className="sr-only">Loading your private page</p>
    </div>
  )
}
