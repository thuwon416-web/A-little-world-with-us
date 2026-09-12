export function calculateLoveScore(firstName: string, secondName: string) {
  const combined = `${firstName}${secondName}`.toLowerCase().replace(/[^a-z0-9]/g, '')
  if (!combined) return 0
  const hash = [...combined].reduce(
    (total, character) => (total * 31 + character.charCodeAt(0)) % 1000,
    7
  )
  return (hash % 100) + 1
}
