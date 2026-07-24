const INTERNAL_ORIGIN = 'https://alemah.invalid'

/**
 * Accept only an application-local absolute path.
 *
 * Besides protocol-relative URLs, backslashes must be rejected because URL
 * parsers can treat them as authority delimiters (for example `/\evil.test`).
 */
export const getSafeInternalPath = (value: string | null | undefined, fallback = '/account') => {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) {
    return fallback
  }

  try {
    const parsed = new URL(value, INTERNAL_ORIGIN)
    if (parsed.origin !== INTERNAL_ORIGIN) return fallback

    return `${parsed.pathname}${parsed.search}${parsed.hash}`
  } catch {
    return fallback
  }
}
