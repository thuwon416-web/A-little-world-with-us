export type AstrologyProfile = {
  birthDate: Date
  westernSign: string
  chineseSign: string
  numerologyNumber: number
}

const westernSigns = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'] as const
const chineseSigns = ['Rat', 'Ox', 'Tiger', 'Rabbit', 'Dragon', 'Snake', 'Horse', 'Goat', 'Monkey', 'Rooster', 'Dog', 'Pig'] as const

function reduceToSingleDigit(value: number) {
  let result = value
  while (result > 9 && result !== 11 && result !== 22 && result !== 33) {
    result = String(result).split('').reduce((sum, digit) => sum + Number(digit), 0)
  }
  return result
}

export function createAstrologyProfile(birthDate: Date): AstrologyProfile {
  const day = birthDate.getDate()
  const month = birthDate.getMonth() + 1
  let westernSign: (typeof westernSigns)[number] = 'Pisces'
  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) westernSign = 'Aries'
  else if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) westernSign = 'Taurus'
  else if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) westernSign = 'Gemini'
  else if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) westernSign = 'Cancer'
  else if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) westernSign = 'Leo'
  else if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) westernSign = 'Virgo'
  else if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) westernSign = 'Libra'
  else if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) westernSign = 'Scorpio'
  else if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) westernSign = 'Sagittarius'
  else if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) westernSign = 'Capricorn'
  else if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) westernSign = 'Aquarius'
  const year = birthDate.getFullYear()
  const chineseSign = chineseSigns[((year - 1900) % 12 + 12) % 12]
  const numerologyNumber = reduceToSingleDigit(
    reduceToSingleDigit(day) + reduceToSingleDigit(month) + reduceToSingleDigit(year)
  )
  return { birthDate, westernSign, chineseSign, numerologyNumber }
}

export function calculateSynastry(profile1: AstrologyProfile, profile2: AstrologyProfile) {
  const elements: Record<string, string> = {
    Aries: 'Fire', Leo: 'Fire', Sagittarius: 'Fire',
    Taurus: 'Earth', Virgo: 'Earth', Capricorn: 'Earth',
    Gemini: 'Air', Libra: 'Air', Aquarius: 'Air',
    Cancer: 'Water', Scorpio: 'Water', Pisces: 'Water',
  }
  const element1 = elements[profile1.westernSign]
  const element2 = elements[profile2.westernSign]
  const western = element1 === element2
    ? 15
    : (element1 === 'Fire' && element2 === 'Air') || (element1 === 'Air' && element2 === 'Fire') ||
      (element1 === 'Earth' && element2 === 'Water') || (element1 === 'Water' && element2 === 'Earth')
      ? 10
      : 5
  const distance = Math.abs(chineseSigns.indexOf(profile1.chineseSign as (typeof chineseSigns)[number]) - chineseSigns.indexOf(profile2.chineseSign as (typeof chineseSigns)[number]))
  const chinese = [4, 8].includes(distance) ? 15 : [2, 10].includes(distance) ? 10 : [3, 9].includes(distance) ? -5 : distance === 6 ? -10 : 0
  const complementary: Record<number, number[]> = { 1: [2, 3, 5, 7], 2: [1, 4, 7], 3: [1, 5, 9], 4: [2, 6, 8], 5: [1, 3, 7], 6: [4, 9], 7: [1, 2, 5], 8: [4, 6], 9: [3, 6] }
  const numerology = profile1.numerologyNumber === profile2.numerologyNumber
    ? 10
    : complementary[profile1.numerologyNumber]?.includes(profile2.numerologyNumber) ? 15 : 0
  return Math.max(0, Math.min(100, 50 + western + chinese + numerology))
}
