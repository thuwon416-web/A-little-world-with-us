export function Spinner({ size = 20, color = '#d8b9c8', className = '' }: { size?: number; color?: string; className?: string }) {
  return (
    <div
      className={`inline-block animate-spin rounded-full border-2 border-transparent border-t-current ${className}`.trim()}
      style={{
        width: size,
        height: size,
        borderTopColor: color,
        borderRightColor: color,
      }}
      aria-label="Loading"
    />
  )
}
