export type AuthErrorCode =
  | 'ACCOUNT_BLOCKED'
  | 'ACCOUNT_EXISTS'
  | 'EMAIL_NOT_VERIFIED'
  | 'IDENTITY_CONFLICT'
  | 'INVALID_CREDENTIALS'
  | 'INVALID_INPUT'
  | 'OAUTH_CANCELLED'
  | 'OAUTH_FAILED'
  | 'RATE_LIMITED'
  | 'RESET_TOKEN_INVALID'
  | 'UNKNOWN_ERROR'

export type AuthActionResult =
  | {
      success: true
      message?: string
      redirectTo?: string
    }
  | {
      success: false
      code: AuthErrorCode
      fieldErrors?: Record<string, string[]>
      message: string
    }

export type SafeUser = {
  authMethods: Array<'google' | 'password'>
  avatarURL: null | string
  displayName: null | string
  email: string
  firstName: string
  hasLocalPassword: boolean
  id: number | string
  lastName: null | string
  role: 'admin' | 'customer' | 'support'
}
