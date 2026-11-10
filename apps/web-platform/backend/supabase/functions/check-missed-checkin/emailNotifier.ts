export class EmailProviderNotConfiguredError extends Error {
  constructor() {
    super('Emergency-contact email provider is not configured.')
    this.name = 'EmailProviderNotConfiguredError'
  }
}

export async function sendEmergencyContactEmail(_input: { to: string; contactId: string; checkinId: string }): Promise<void> {
  throw new EmailProviderNotConfiguredError()
}
