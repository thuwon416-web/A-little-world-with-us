import fs from 'node:fs'

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'))
const tailwind = pkg.devDependencies?.tailwindcss
if (tailwind !== '3.4.17') throw new Error(`Expected Tailwind 3.4.17, found ${tailwind}`)
if (!fs.existsSync('tailwind.config.ts')) throw new Error('tailwind.config.ts missing')
if (!fs.existsSync('postcss.config.js')) throw new Error('postcss.config.js missing')
console.log('Tailwind config baseline verified: 3.4.17 + v3 PostCSS config')
