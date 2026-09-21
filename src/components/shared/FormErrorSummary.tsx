'use client'
export function FormErrorSummary({
  errors
}: {
  errors: Array<{ field: string; message: string }>
}) {
  if (errors.length === 0) return null
  return (
    <div role="alert" aria-live="assertive"
      className="rounded-xl border border-error/30 bg-error/10 p-4 text-sm text-error">
      <p className="font-medium">Please fix the following:</p>
      <ul className="mt-2 list-disc list-inside space-y-1">
        {errors.map((e) => (
          <li key={e.field}>
            <a href={`#${e.field}`} className="underline">{e.message}</a>
          </li>
        ))}
      </ul>
    </div>
  )
}
