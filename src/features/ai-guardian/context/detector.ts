import { CONTEXT_KEYWORDS, type ContextCategory } from './keywords'

export type DetectedContext = { category: ContextCategory; matchedKeywords: string[] }

export function detectContextKeywords(text: string): DetectedContext[] {
  const normalized = text.normalize('NFKC').toLocaleLowerCase()
  return Object.entries(CONTEXT_KEYWORDS)
    .map(([category, keywords]) => ({
      category: category as ContextCategory,
      matchedKeywords: keywords.filter((keyword) => normalized.includes(keyword.toLocaleLowerCase())),
    }))
    .filter((result) => result.matchedKeywords.length > 0)
    .slice(0, 3)
}
