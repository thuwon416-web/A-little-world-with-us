export async function exportUserData(): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('/api/export', { method: 'POST' })
    if (!response.ok) {
      const body = await response.json().catch(() => ({ error: 'Unable to prepare backup.' })) as { error?: string }
      return { success: false, error: body.error }
    }
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `a-little-world-backup-${new Date().toISOString().slice(0, 10)}.zip`
    anchor.click()
    URL.revokeObjectURL(url)
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unable to prepare backup.' }
  }
}
