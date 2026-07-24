'use client'

import { Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import React, { useCallback, useState } from 'react'
import { useForm } from 'react-hook-form'

import { FormError } from '@/components/forms/FormError'
import { FormItem } from '@/components/forms/FormItem'
import { Message } from '@/components/Message'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getSafeInternalPath } from '@/lib/auth/safe-redirect'
import { useAuth } from '@/providers/Auth'

type FormData = { email: string; password: string }

const GoogleMark = () => (
  <svg aria-hidden="true" className="mr-2 size-4" viewBox="0 0 24 24">
    <path
      d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.92h5.38a4.6 4.6 0 0 1-2 3.02v2.54h3.24c1.9-1.75 2.98-4.33 2.98-7.41Z"
      fill="currentColor"
    />
    <path d="M12 22c2.7 0 4.98-.9 6.64-2.42l-3.24-2.54c-.9.6-2.05.96-3.4.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.62A10 10 0 0 0 12 22Z" fill="currentColor" opacity=".75" />
    <path d="M6.39 13.87A6 6 0 0 1 6.08 12c0-.65.11-1.28.31-1.87V7.51H3.04A10 10 0 0 0 2 12c0 1.61.38 3.13 1.04 4.49l3.35-2.62Z" fill="currentColor" opacity=".55" />
    <path d="M12 6c1.47 0 2.79.5 3.83 1.5l2.88-2.88A9.64 9.64 0 0 0 12 2a10 10 0 0 0-8.96 5.51l3.35 2.62C7.18 7.76 9.39 6 12 6Z" fill="currentColor" opacity=".9" />
  </svg>
)

export const LoginForm = () => {
  const searchParams = useSearchParams()
  const returnTo = getSafeInternalPath(
    searchParams.get('returnTo') || searchParams.get('redirect'),
  )
  const { login } = useAuth()
  const router = useRouter()
  const [error, setError] = useState<null | string>(searchParams.get('error'))
  const [showPassword, setShowPassword] = useState(false)
  const googleEnabled = process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === 'true'
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<FormData>({ defaultValues: { email: searchParams.get('email') || '' } })

  const onSubmit = useCallback(
    async (data: FormData) => {
      try {
        setError(null)
        await login({ ...data, returnTo })
        router.replace(returnTo)
        router.refresh()
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : 'Unable to sign in.')
      }
    },
    [login, returnTo, router],
  )

  return (
    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
      <Message error={error} message={searchParams.get('notice') || undefined} />
      <FormItem>
        <Label htmlFor="email">Email</Label>
        <Input
          autoComplete="email"
          id="email"
          type="email"
          {...register('email', { required: 'Email is required.' })}
        />
        {errors.email && <FormError message={errors.email.message} />}
      </FormItem>
      <FormItem>
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          <Link className="text-sm underline" href="/forgot-password">Forgot password?</Link>
        </div>
        <div className="relative">
          <Input
            autoComplete="current-password"
            className="pr-12"
            id="password"
            type={showPassword ? 'text' : 'password'}
            {...register('password', { required: 'Password is required.' })}
          />
          <button
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className="absolute inset-y-0 right-0 grid w-11 place-items-center"
            onClick={() => setShowPassword((value) => !value)}
            type="button"
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        {errors.password && <FormError message={errors.password.message} />}
      </FormItem>
      <Button className="w-full" disabled={isSubmitting} size="lg" type="submit">
        {isSubmitting ? 'Signing in…' : 'Sign in'}
      </Button>
      {googleEnabled && (
        <>
          <div className="flex items-center gap-3 text-xs uppercase tracking-[0.16em] text-primary/45">
            <span className="h-px flex-1 bg-primary/10" />Or<span className="h-px flex-1 bg-primary/10" />
          </div>
          <Button asChild className="w-full" size="lg" variant="outline">
            <a href={`/api/auth/google?returnTo=${encodeURIComponent(returnTo)}`}>
              <GoogleMark />Continue with Google
            </a>
          </Button>
        </>
      )}
      <p className="text-center text-sm">
        New to Alemah? <Link className="underline" href={`/signup?returnTo=${encodeURIComponent(returnTo)}`}>Create an account</Link>
      </p>
    </form>
  )
}
