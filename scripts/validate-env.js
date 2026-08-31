const fs = require('fs')
const path = require('path')

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return

  const content = fs.readFileSync(filePath, 'utf8')

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue

    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/)
    if (!match) continue

    const [, key, value] = match
    if (typeof process.env[key] === 'undefined') {
      process.env[key] = value.replace(/^['"]|['"]$/g, '').trim()
    }
  }
}

loadEnvFile(path.join(__dirname, '..', '.env.local'))
loadEnvFile(path.join(__dirname, '..', '.env'))

const requiredEnv = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'NEXT_PUBLIC_APP_PASSWORD',
]

const optionalEnv = [
  'NEXT_PUBLIC_ANNIVERSARY',
  'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY',
  'NEXT_PUBLIC_VIDEO_URLS',
  'NEXT_PUBLIC_PIN_CODE',
  'NEXT_PUBLIC_AI_API_URL',
  'NEXT_PUBLIC_COUPLE_START',
]

const missingRequired = requiredEnv.filter(
  (key) => !process.env[key] || !process.env[key].trim()
)

if (missingRequired.length > 0) {
  console.error('\nEnvironment validation failed.\n')
  console.error('Missing required environment variables:')
  missingRequired.forEach((key) => {
    console.error(`  - ${key}`)
  })
  console.error('\nAdd them to your .env.local file or deployment environment.')
  console.error('Example values are provided in .env.example.\n')
  process.exit(1)
}

for (const key of optionalEnv) {
  if (!process.env[key] || !process.env[key].trim()) {
    console.warn(
      `[env] Optional variable "${key}" is not set. The app may use fallback defaults for that feature.`
    )
  }
}

console.log('Environment validation passed.')
