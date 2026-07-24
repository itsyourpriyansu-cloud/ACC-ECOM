import { NextResponse } from 'next/server'
import type { ZodError } from 'zod'

import type { AuthActionResult, AuthErrorCode } from './types'

export const authError = (
  code: AuthErrorCode,
  message: string,
  status = 400,
  fieldErrors?: Record<string, string[]>,
) =>
  NextResponse.json<AuthActionResult>(
    { code, fieldErrors, message, success: false },
    { headers: { 'Cache-Control': 'no-store' }, status },
  )

export const validationError = (error: ZodError) =>
  authError(
    'INVALID_INPUT',
    'Please check the highlighted fields.',
    400,
    error.flatten().fieldErrors as Record<string, string[]>,
  )

export const authSuccess = (message: string, redirectTo?: string, status = 200) =>
  NextResponse.json<AuthActionResult>(
    { message, redirectTo, success: true },
    { headers: { 'Cache-Control': 'no-store' }, status },
  )
