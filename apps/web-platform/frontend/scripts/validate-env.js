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
]

// Local validation may compile the UI without reaching Supabase.  Production
// and ordinary builds still require real public configuration; this bypass is
// deliberately opt-in so a missing deployment variable can never be masked.
if (process.env.LOCAL_VALIDATION_BUILD === 'true') {
  process.env.NEXT_PUBLIC_SUPABASE_URL ||= 'https://local-validation.supabase.co'
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||= 'local-validation-anon-key'
}

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

console.log('Environment validation passed.')
