export function isSameOriginRequest(request: Request): boolean {
  if (request.headers.get('authorization')) return true

  const origin = request.headers.get('origin')
  if (origin) return origin === new URL(request.url).origin

  return request.headers.get('sec-fetch-site') === 'same-origin'
}
