export const OAUTH_SESSION_COOKIE = 'app_oauth_session'
export const OAUTH_FLOW_COOKIE = 'app_google_oauth_flow'
export const OAUTH_SESSION_SECONDS = 60 * 60 * 24 * 7
export const OAUTH_FLOW_SECONDS = 10 * 60
export const OAUTH_LAST_USED_THROTTLE_MS = 60 * 60 * 1000

export const getAppURL = () => {
  const configured =
    process.env.APP_URL ||
    process.env.PAYLOAD_PUBLIC_SERVER_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SERVER_URL ||
    'http://localhost:3000'

  return configured.replace(/\/+$/, '')
}

export const getGoogleRedirectURI = () =>
  process.env.GOOGLE_REDIRECT_URI || `${getAppURL()}/api/auth/google/callback`

export const getAuthSessionSecret = (payloadSecret?: string) => {
  const secret = process.env.AUTH_SESSION_SECRET || payloadSecret
  if (!secret) throw new Error('AUTH_SESSION_SECRET is required.')
  return secret
}

export const getCookieOptions = () => ({
  domain: process.env.AUTH_COOKIE_DOMAIN || undefined,
  httpOnly: true as const,
  path: '/',
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
})
