const MAX_PROMPT_LENGTH = 1000

/**
 * Treat user input as untrusted data. This is not an attempt to "understand"
 * or erase prompt injection; it only removes control-like wrappers and bounds
 * the payload. Authorization and side effects must never depend on model output.
 */
export function sanitizeAiUserPrompt(input: string) {
  return input
    .replace(/\u0000/g, '')
    .replace(/<\/?(system|assistant|developer|tool|function)>/gi, '')
    .replace(/\[\[(?:system|assistant|developer|tool|function)\]\]/gi, '')
    .trim()
    .slice(0, MAX_PROMPT_LENGTH)
}
