'use client'

import { FormError } from '@/components/forms/FormError'
import { FormItem } from '@/components/forms/FormItem'
import { Message } from '@/components/Message'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/providers/Auth'
import { Chrome } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import React, { useCallback, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'

type FormData = {
  email: string
  name?: string
  password?: string
  passwordConfirm?: string
}

export const CreateAccountForm: React.FC = () => {
  const searchParams = useSearchParams()
  const allParams = searchParams.toString() ? `?${searchParams.toString()}` : ''
  const { login } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<null | string>(null)
  const [step, setStep] = useState<'email' | 'signup'>('email')
  const googleEnabled = process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === 'true'

  const {
    formState: { errors },
    handleSubmit,
    register,
    watch,
  } = useForm<FormData>()

  const password = useRef('')
  password.current = watch('password', '') || ''

  const continueWithEmail = useCallback(
    async ({ email }: FormData) => {
      try {
        setLoading(true)
        setError(null)
        const response = await fetch('/auth/email/continue', {
          body: JSON.stringify({ email }),
          headers: { 'Content-Type': 'application/json' },
          method: 'POST',
        })
        const result = (await response.json()) as { message?: string; next?: 'login' | 'signup' }

        if (!response.ok || !result.next) throw new Error(result.message || 'We could not check this email.')

        if (result.next === 'login') {
          const params = new URLSearchParams({
            email,
            notice: 'An Alemah account already exists for this email. Please sign in.',
          })
          const redirect = searchParams.get('redirect')
          if (redirect) params.set('redirect', redirect)
          router.push(`/login?${params.toString()}`)
          return
        }

        setStep('signup')
      } catch (caughtError) {
        setError(caughtError instanceof Error ? caughtError.message : 'Please try again.')
      } finally {
        setLoading(false)
      }
    },
    [router, searchParams],
  )

  const createAccount = useCallback(
    async (data: FormData) => {
      try {
        setLoading(true)
        setError(null)
        if (!data.password || !data.passwordConfirm) throw new Error('Please choose and confirm a password.')

        const response = await fetch('/api/users', {
          body: JSON.stringify({
            email: data.email,
            name: data.name,
            password: data.password,
            passwordConfirm: data.passwordConfirm,
          }),
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          method: 'POST',
        })

        if (!response.ok) {
          throw new Error(response.statusText || 'There was an error creating the account.')
        }

        await login({ email: data.email, password: data.password })
        const redirect = searchParams.get('redirect')
        if (redirect) router.push(redirect)
        else router.push(`/account?success=${encodeURIComponent('Account created successfully')}`)
      } catch (error) {
        setError(error instanceof Error ? error.message : 'There was an error creating the account. Please try again.')
      } finally {
        setLoading(false)
      }
    },
    [login, router, searchParams],
  )

  return (
    <form
      className="max-w-lg py-4"
      onSubmit={handleSubmit(step === 'email' ? continueWithEmail : createAccount)}
    >
      <div className="prose dark:prose-invert mb-6">
        <p>{step === 'email'
          ? 'Start with your email. We will take you to sign in if you already have an Alemah account.'
          : 'Create your Alemah account to save addresses, view orders and make checkout faster.'}</p>
      </div>

      <Message error={error} />

      <div className="flex flex-col gap-8 mb-8">
        <FormItem>
          <Label htmlFor="email" className="mb-2">
            Email Address
          </Label>
          <Input
            id="email"
            {...register('email', { required: 'Email is required.' })}
            readOnly={step === 'signup'}
            type="email"
          />
          {errors.email && <FormError message={errors.email.message} />}
        </FormItem>

        {step === 'signup' && (
          <>
            <FormItem>
              <Label htmlFor="name" className="mb-2">Your name</Label>
              <Input id="name" {...register('name', { required: 'Please provide your name.' })} type="text" />
              {errors.name && <FormError message={errors.name.message} />}
            </FormItem>
            <FormItem>
              <Label htmlFor="password" className="mb-2">New password</Label>
              <Input id="password" {...register('password', { required: 'Password is required.' })} type="password" />
              {errors.password && <FormError message={errors.password.message} />}
            </FormItem>
            <FormItem>
              <Label htmlFor="passwordConfirm" className="mb-2">Confirm password</Label>
              <Input
                id="passwordConfirm"
                {...register('passwordConfirm', {
                  required: 'Please confirm your password.',
                  validate: (value) => value === password.current || 'The passwords do not match',
                })}
                type="password"
              />
              {errors.passwordConfirm && <FormError message={errors.passwordConfirm.message} />}
            </FormItem>
          </>
        )}
      </div>
      <Button disabled={loading} type="submit" variant="default">
        {loading ? 'Processing' : step === 'email' ? 'Continue with email' : 'Create account'}
      </Button>

      {step === 'signup' && (
        <Button className="ml-3" onClick={() => setStep('email')} type="button" variant="ghost">
          Use a different email
        </Button>
      )}

      {googleEnabled && (
        <>
          <div className="my-7 flex items-center gap-3 text-xs uppercase tracking-[0.16em] text-primary/45">
            <span className="h-px flex-1 bg-primary/10" />
            Or
            <span className="h-px flex-1 bg-primary/10" />
          </div>
          <Button asChild className="w-full" size="lg" variant="outline">
            <a href={`/auth/google?returnTo=${encodeURIComponent(searchParams.get('redirect') || '/account')}`}>
              <Chrome className="mr-2 size-4" />
              Continue with Google
            </a>
          </Button>
        </>
      )}

      <div className="prose dark:prose-invert mt-8">
        <p>
          {'Already have an account? '}
          <Link href={`/login${allParams}`}>Login</Link>
        </p>
      </div>
    </form>
  )
}
