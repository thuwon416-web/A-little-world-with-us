export async function getPartnerMood() {
  return {
    mood: 'calm',
    shared: false,
    note: 'Partner sharing is off by default.',
  }
}

export async function getCareSuggestions() {
  return [
    'Send a check-in message and ask how they are feeling.',
    'Offer a quiet reset with tea and a walk.',
    'Plan a small comfort ritual together this evening.',
  ]
}

export async function sendCareMessage(message: string) {
  return {
    success: true,
    message,
    sentAt: new Date().toISOString(),
  }
}
