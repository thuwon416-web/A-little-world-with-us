export function formatUntrustedContext(context: string): string {
  const escaped = context.replace(/<\/untrusted_context/gi, '<\\/untrusted_context')
  return '<untrusted_context>\n' + escaped + '\n</untrusted_context>'
}
