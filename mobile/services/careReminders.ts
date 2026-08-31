export async function scheduleWaterReminder(time = '09:00') {
  return { type: 'water', time, scheduled: true }
}

export async function scheduleSleepReminder(time = '22:30') {
  return { type: 'sleep', time, scheduled: true }
}

export async function scheduleMealReminder(time = '13:00') {
  return { type: 'meal', time, scheduled: true }
}

export async function getCareStats() {
  return {
    total: 4,
    completed: 3,
    percentage: 75,
  }
}
