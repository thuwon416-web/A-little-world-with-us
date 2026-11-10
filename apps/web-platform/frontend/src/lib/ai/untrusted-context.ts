/**
 * Delimit retrieved user-controlled material as data, never as instructions.
 * Closing delimiters are neutralized so the retrieved text cannot escape its
 * block and append attacker-controlled trusted-looking instructions.
 */
export function formatUntrustedContext(context: string): string {
  const escaped = context.replace(/<\/untrusted_context/gi, '<\\/untrusted_context')
  return `<untrusted_context>\n${escaped}\n</untrusted_context>`
}
