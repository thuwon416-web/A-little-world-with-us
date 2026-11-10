export function getCronJobSecretHeaders(): Record<string, string> {
  const secret = process.env.CRON_SECRET || process.env.JOB_SECRET
  if (!secret) throw new Error('Cron job secret is not configured.')
  return { 'x-job-secret': secret }
}
