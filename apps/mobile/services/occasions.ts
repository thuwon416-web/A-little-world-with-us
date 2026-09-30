type Occasion = {
  title: string
  date: string
  description: string
}

export function getAnniversaries(startDate: string, years: number = 5): Occasion[] {
  const base = new Date(startDate)
  const list: Occasion[] = []

  for (let i = 1; i <= years; i += 1) {
    const target = new Date(base)
    target.setFullYear(base.getFullYear() + i)
    list.push({
      title: `Anniversary ${i}`,
      date: target.toISOString(),
      description: `Celebrate your ${i}${i === 1 ? 'st' : i === 2 ? 'nd' : i === 3 ? 'rd' : 'th'} year together.`,
    })
  }

  return list
}

export function getBirthdays(birthday: string): Occasion[] {
  const base = new Date(birthday)
  const currentYear = new Date().getFullYear()
  const target = new Date(base)
  target.setFullYear(currentYear)

  return [
    {
      title: 'Birthday',
      date: target.toISOString(),
      description: 'Celebrate your favorite person with a birthday surprise.',
    },
  ]
}

export function scheduleOccasionReminders() {
  return [
    {
      title: 'Anniversary reminder',
      message: 'Time to celebrate your love story.',
    },
    {
      title: 'Birthday reminder',
      message: 'Your birthday surprise is ready to plan.',
    },
  ]
}
