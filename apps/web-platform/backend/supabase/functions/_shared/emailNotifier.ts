export type EmergencyEmailInput = {
  to: string
  subject: string
  body: string
  metadata: Record<string, string | number | boolean>
}

export interface EmailNotifier {
  sendEmergencyEmail(input: EmergencyEmailInput): Promise<void>
}

export class EmailProviderNotConfiguredError extends Error {
  constructor(message = 'Emergency email provider is not configured.') {
    super(message)
    this.name = 'EmailProviderNotConfiguredError'
  }
}

export class ResendApiError extends Error {
  constructor(readonly status: number) {
    super(`Resend email request failed with HTTP ${status}.`)
    this.name = 'ResendApiError'
  }
}

export class ResendNotifier implements EmailNotifier {
  constructor(
    private readonly apiKey: string,
    private readonly from: string,
    private readonly fetcher: typeof fetch = fetch,
  ) {}

  async sendEmergencyEmail(input: EmergencyEmailInput): Promise<void> {
    const tags = Object.entries(input.metadata).map(([name, value]) => ({
      name: name.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 256),
      value: String(value).slice(0, 256),
    }))
    const response = await this.fetcher('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: this.from,
        to: [input.to],
        subject: input.subject,
        text: input.body,
        tags,
      }),
    })
    if (!response.ok) throw new ResendApiError(response.status)
  }
}

/** Test-only notifier. Production configuration never selects this adapter. */
export class NoopNotifier implements EmailNotifier {
  async sendEmergencyEmail(): Promise<void> {
    throw new EmailProviderNotConfiguredError('NoopNotifier cannot deliver emergency email.')
  }
}

export function createEmailNotifier(
  readEnv: (name: string) => string | undefined,
  fetcher: typeof fetch = fetch,
): EmailNotifier {
  const provider = (readEnv('EMAIL_PROVIDER') || 'resend').trim().toLowerCase()
  if (provider === 'noop') return new NoopNotifier()
  if (provider !== 'resend') {
    throw new EmailProviderNotConfiguredError(`Unsupported EMAIL_PROVIDER: ${provider}.`)
  }

  const apiKey = readEnv('RESEND_API_KEY')?.trim()
  if (!apiKey) {
    throw new EmailProviderNotConfiguredError('EMAIL_PROVIDER=resend requires RESEND_API_KEY at startup.')
  }
  const from = readEnv('EMERGENCY_EMAIL_FROM')?.trim()
  if (!from) {
    throw new EmailProviderNotConfiguredError('EMAIL_PROVIDER=resend requires EMERGENCY_EMAIL_FROM at startup.')
  }
  return new ResendNotifier(apiKey, from, fetcher)
}
