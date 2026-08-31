// convert-boards.js
const fs = require('fs')
const path = require('path')

const sourceDir = path.join(__dirname, 'src/features/wellness')
const dataFile = path.join(__dirname, 'src/data/wellness-boards.ts')

const files = fs.readdirSync(sourceDir).filter((f) => f.endsWith('.tsx'))

const boards = []

// Helper function to extract meaningful text from a file
function extractText(content) {
  let texts = []
  // 1. Extract string literals (single or double quotes)
  let stringRegex = /["']([^"']+)["']/g
  let match
  while ((match = stringRegex.exec(content)) !== null) {
    let text = match[1].trim()
    // Filter out obvious code snippets, imports, class names, etc.
    if (
      text.length > 2 &&
      !text.startsWith('import') &&
      !text.startsWith('export') &&
      !text.startsWith('from') &&
      !text.startsWith('@/') &&
      !text.includes('className') &&
      !text.includes('px-') &&
      !text.includes('py-') &&
      !text.includes('text-') &&
      !text.includes('bg-') &&
      !text.includes('hover:') &&
      !text.includes('flex') &&
      !text.includes('grid') &&
      !text.includes('gap-') &&
      !text.includes('w-') &&
      !text.includes('h-') &&
      !text.includes('rounded') &&
      !text.includes('border') &&
      !text.includes('shadow') &&
      !text.includes('font-') &&
      !text.includes('animate-') &&
      !text.includes('transition') &&
      !text.includes('opacity') &&
      !text.includes('justify') &&
      !text.includes('items-') &&
      !text.includes('space-') &&
      !text.includes('absolute') &&
      !text.includes('relative') &&
      !text.includes('fixed') &&
      !text.includes('onClick') &&
      !text.includes('onChange') &&
      !text.includes('onSubmit') &&
      !text.includes('type=') &&
      !text.includes('value=') &&
      !text.includes('name=') &&
      !text.includes('style=') &&
      !text.includes('href=') &&
      !text.includes('src=') &&
      !text.includes('const ') &&
      !text.includes('return ') &&
      !text.includes('function ') &&
      !text.includes('interface ') &&
      !text.includes('type ') &&
      !text.includes('useState')
    ) {
      texts.push(text)
    }
  }

  // 2. Extract JSX text content (between > and <)
  let jsxRegex = />([^<>{}]+)</g
  while ((match = jsxRegex.exec(content)) !== null) {
    let text = match[1].trim()
    if (
      text.length > 2 &&
      !text.startsWith('{') &&
      !text.startsWith('}') &&
      !text.startsWith('//')
    ) {
      texts.push(text)
    }
  }
  return texts
}

files.forEach((file) => {
  const filePath = path.join(sourceDir, file)
  const content = fs.readFileSync(filePath, 'utf8')
  const texts = extractText(content)

  // Generate board id from filename
  const id = file
    .replace('.tsx', '')
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .toLowerCase()
  const title = file
    .replace('.tsx', '')
    .replace(/([A-Z])/g, ' $1')
    .trim()

  // Create board object
  boards.push({
    id,
    title,
    description:
      texts.length > 0 ? texts[0] : `A ${title.replace('Board', '').toLowerCase()} experience`,
    category: 'wellness',
    icon: '🌸',
    content: texts.slice(1, 4).map((text) => ({ text, action: 'Reflect on this' })),
  })
})

const output = `import { WellnessBoard } from "@/types/wellness";\n\nexport const wellnessBoards: WellnessBoard[] = ${JSON.stringify(boards, null, 2)};\n`

fs.writeFileSync(dataFile, output, 'utf8')
console.log(`✅ Generated ${boards.length} boards in ${dataFile}`)
