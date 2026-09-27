export function extractYouTubeId(input: string) {
  const value = input.trim()
  if (/^[A-Za-z0-9_-]{11}$/.test(value)) return value
  const match =
    value.match(/youtu\.be\/([A-Za-z0-9_-]{11})/) ??
    value.match(/youtube\.com\/watch\?v=([A-Za-z0-9_-]{11})/) ??
    value.match(/youtube\.com\/embed\/([A-Za-z0-9_-]{11})/) ??
    value.match(/youtube\.com\/shorts\/([A-Za-z0-9_-]{11})/)
  return match?.[1] ?? null
}

export function getYouTubeThumbnail(videoId: string) {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
}
