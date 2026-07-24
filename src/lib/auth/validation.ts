import { z } from 'zod'

export const normalizeEmail = (email: string) => email.trim().toLowerCase()

const email = z.string().trim().email().max(254).transform(normalizeEmail)
const password = z
  .string()
  .min(12, 'Use at least 12 characters.')
  .max(128, 'Use no more than 128 characters.')
  .refine(
    (value) =>
      value.length >= 16 ||
      (/[a-z]/.test(value) && /[A-Z]/.test(value) && /\d/.test(value)),
    'Use a longer passphrase or include upper-case, lower-case, and number characters.',
  )

export const signupSchema = z
  .object({
    acceptedTerms: z.literal(true, { error: 'You must accept the terms and privacy policy.' }),
    email,
    firstName: z.string().trim().min(1).max(80),
    lastName: z.string().trim().max(80).optional().default(''),
    password,
    passwordConfirm: z.string(),
  })
  .refine((value) => value.password === value.passwordConfirm, {
    message: 'The passwords do not match.',
    path: ['passwordConfirm'],
  })

export const loginSchema = z.object({
  email,
  password: z.string().min(1).max(128),
  returnTo: z.string().optional(),
})

export const forgotPasswordSchema = z.object({ email })

export const resetPasswordSchema = z
  .object({
    password,
    passwordConfirm: z.string(),
    token: z.string().min(20).max(512),
  })
  .refine((value) => value.password === value.passwordConfirm, {
    message: 'The passwords do not match.',
    path: ['passwordConfirm'],
  })

export const profileSchema = z.object({
  avatarURL: z.union([z.literal(''), z.string().trim().url().max(2048)]).optional(),
  displayName: z.string().trim().max(120).optional(),
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().max(80).optional(),
})

export const passwordSchema = z
  .object({
    currentPassword: z.string().max(128).optional(),
    password,
    passwordConfirm: z.string(),
  })
  .refine((value) => value.password === value.passwordConfirm, {
    message: 'The passwords do not match.',
    path: ['passwordConfirm'],
  })
