/**
 * Astrology Calculator - Phase 3B
 * Calculates Western zodiac, Chinese zodiac, Myanmar day, Numerology, and Synastry
 */

export interface AstrologyProfile {
  birthDate: Date
  westernSign: WesternSign
  chineseSign: ChineseSign
  myanmarDay: MyanmarDay
  numerologyNumber: number
}

export type WesternSign =
  | 'Aries' | 'Taurus' | 'Gemini' | 'Cancer'
  | 'Leo' | 'Virgo' | 'Libra' | 'Scorpio'
  | 'Sagittarius' | 'Capricorn' | 'Aquarius' | 'Pisces'

export type ChineseSign =
  | 'Rat' | 'Ox' | 'Tiger' | 'Rabbit'
  | 'Dragon' | 'Snake' | 'Horse' | 'Goat'
  | 'Monkey' | 'Rooster' | 'Dog' | 'Pig'

export type MyanmarDay =
  | 'တနင်္လာ' | 'အင်္ဂါ' | 'ဗုဒ္ဓဟူး'
  | 'ကြာသပတေး' | 'သောကြာ' | 'စနေ' | 'တနင်္ဂနွေ'

/**
 * Calculate Western zodiac sign from birth date
 */
export function calculateWesternSign(date: Date): WesternSign {
  const day = date.getDate()
  const month = date.getMonth() + 1 // 1-12

  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return 'Aries'
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return 'Taurus'
  if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return 'Gemini'
  if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return 'Cancer'
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return 'Leo'
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return 'Virgo'
  if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return 'Libra'
  if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return 'Scorpio'
  if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return 'Sagittarius'
  if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return 'Capricorn'
  if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return 'Aquarius'
  return 'Pisces'
}

/**
 * Calculate Chinese zodiac sign from birth year
 */
export function calculateChineseSign(date: Date): ChineseSign {
  const year = date.getFullYear()
  const signs: ChineseSign[] = ['Rat', 'Ox', 'Tiger', 'Rabbit', 'Dragon', 'Snake', 'Horse', 'Goat', 'Monkey', 'Rooster', 'Dog', 'Pig']
  const offset = (year - 1900) % 12
  return signs[offset >= 0 ? offset : offset + 12]
}

/**
 * Convert Gregorian date to Myanmar calendar day
 * Simplified calculation - for production, use a proper Myanmar calendar library
 */
export function calculateMyanmarDay(date: Date): MyanmarDay {
  const days: MyanmarDay[] = ['တနင်္လာ', 'အင်္ဂါ', 'ဗုဒ္ဓဟူး', 'ကြာသပတေး', 'သောကြာ', 'စနေ', 'တနင်္ဂနွေ']
  return days[date.getDay()]
}

/**
 * Calculate numerology life path number
 */
export function calculateNumerology(date: Date): number {
  const day = date.getDate()
  const month = date.getMonth() + 1
  const year = date.getFullYear()

  const sum = reduceToSingleDigit(day) + reduceToSingleDigit(month) + reduceToSingleDigit(year)
  return reduceToSingleDigit(sum)
}

function reduceToSingleDigit(num: number): number {
  while (num > 9 && num !== 11 && num !== 22 && num !== 33) {
    num = String(num).split('').reduce((a, b) => a + Number(b), 0)
  }
  return num
}

/**
 * Calculate synastry compatibility score between two profiles
 */
export function calculateSynastry(profile1: AstrologyProfile, profile2: AstrologyProfile): number {
  let score = 50 // Base score

  // Western zodiac compatibility
  score += westernCompatibility(profile1.westernSign, profile2.westernSign)

  // Chinese zodiac compatibility
  score += chineseCompatibility(profile1.chineseSign, profile2.chineseSign)

  // Numerology compatibility
  score += numerologyCompatibility(profile1.numerologyNumber, profile2.numerologyNumber)

  // Clamp to 0-100
  return Math.max(0, Math.min(100, score))
}

function westernCompatibility(sign1: WesternSign, sign2: WesternSign): number {
  const element1 = getElement(sign1)
  const element2 = getElement(sign2)

  // Same element: +15
  if (element1 === element2) return 15

  // Compatible elements: +10
  const compatible: Record<string, string[]> = {
    Fire: ['Air'],
    Air: ['Fire'],
    Earth: ['Water'],
    Water: ['Earth'],
  }

  if (compatible[element1]?.includes(element2)) return 10

  // Neutral: +5
  return 5
}

function getElement(sign: WesternSign): string {
  const fire = ['Aries', 'Leo', 'Sagittarius']
  const earth = ['Taurus', 'Virgo', 'Capricorn']
  const air = ['Gemini', 'Libra', 'Aquarius']
  const _water = ['Cancer', 'Scorpio', 'Pisces']

  if (fire.includes(sign)) return 'Fire'
  if (earth.includes(sign)) return 'Earth'
  if (air.includes(sign)) return 'Air'
  return 'Water'
}

function chineseCompatibility(sign1: ChineseSign, sign2: ChineseSign): number {
  const signs: ChineseSign[] = ['Rat', 'Ox', 'Tiger', 'Rabbit', 'Dragon', 'Snake', 'Horse', 'Goat', 'Monkey', 'Rooster', 'Dog', 'Pig']
  const idx1 = signs.indexOf(sign1)
  const idx2 = signs.indexOf(sign2)

  const distance = Math.abs(idx1 - idx2)

  // Trine (4-year difference): +15
  if (distance === 4 || distance === 8) return 15

  // Sextile (2-year difference): +10
  if (distance === 2 || distance === 10) return 10

  // Square (3-year difference): -5
  if (distance === 3 || distance === 9) return -5

  // Opposition (6-year difference): -10
  if (distance === 6) return -10

  return 0
}

function numerologyCompatibility(num1: number, num2: number): number {
  // Same number: +10
  if (num1 === num2) return 10

  // Complementary pairs: +15
  const complementary: Record<number, number[]> = {
    1: [2, 3, 5, 7],
    2: [1, 4, 7],
    3: [1, 5, 9],
    4: [2, 6, 8],
    5: [1, 3, 7],
    6: [4, 9],
    7: [1, 2, 5],
    8: [4, 6],
    9: [3, 6],
  }

  if (complementary[num1]?.includes(num2)) return 15

  return 0
}

/**
 * Format sign for display
 */
export function formatWesternSign(sign: WesternSign): { en: string; mm: string } {
  const signs = {
    Aries: { en: 'Aries', mm: 'မိန်းမ' },
    Taurus: { en: 'Taurus', mm: 'နွား' },
    Gemini: { en: 'Gemini', mm: 'အမွှာ' },
    Cancer: { en: 'Cancer', mm: 'ကင်ဆာ' },
    Leo: { en: 'Leo', mm: 'ခြင်္သေ့' },
    Virgo: { en: 'Virgo', mm: 'ကောင်းမိန်းမ' },
    Libra: { en: 'Libra', mm: 'ခါးပါး' },
    Scorpio: { en: 'Scorpio', mm: 'ကင်ဆာ' },
    Sagittarius: { en: 'Sagittarius', mm: 'မုဆိုး' },
    Capricorn: { en: 'Capricorn', mm: 'ဆိတ်' },
    Aquarius: { en: 'Aquarius', mm: 'ရေ' },
    Pisces: { en: 'Pisces', mm: 'ငါး' },
  }
  return signs[sign]
}

export function formatChineseSign(sign: ChineseSign): { en: string; mm: string } {
  const signs = {
    Rat: { en: 'Rat', mm: 'ကြွက်' },
    Ox: { en: 'Ox', mm: 'နွား' },
    Tiger: { en: 'Tiger', mm: 'ကျား' },
    Rabbit: { en: 'Rabbit', mm: 'ယုန်' },
    Dragon: { en: 'Dragon', mm: 'နဂါး' },
    Snake: { en: 'Snake', mm: 'မြွေ' },
    Horse: { en: 'Horse', mm: 'မြင်း' },
    Goat: { en: 'Goat', mm: 'ဆိတ်' },
    Monkey: { en: 'Monkey', mm: 'မျောက်' },
    Rooster: { en: 'Rooster', mm: 'ကြက်' },
    Dog: { en: 'Dog', mm: 'ခွေး' },
    Pig: { en: 'Pig', mm: 'ဝက်' },
  }
  return signs[sign]
}
