export function scheduleDailyCheckin(hour: number = 20, skipWeekends: boolean = true) {
  return {
    hour,
    skipWeekends,
    title: 'Daily check-in',
    message: 'Take a minute to check in with each other today.',
  }
}
