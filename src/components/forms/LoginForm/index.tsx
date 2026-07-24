'use client'

import { FormError } from '@/components/forms/FormError'
import { FormItem } from '@/components/forms/FormItem'
import { getSafeInternalPath } from '@/lib/auth/safe-redirect'
import { Message } from '@/components/Message'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/providers/Auth'
import { Chrome } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import React, { useCallback } from 'react'
import { useForm } from 'react-hook-form'

type FormData = {
  email: string
  password: string
}

export const LoginForm: React.FC = () => {
  const searchParams = useSearchParams()
  const allParams = searchParams.toString() ? `?${searchParams.toString()}` : ''
  const redirect = getSafeInternalPath(searchParams.get('redirect'))
  const { login } = useAuth()
  const router = useRouter()
  const [error, setError] = React.useState<null | string>(null)
  const googleEnabled = process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === 'true'

  const {
    formState: { errors, isLoading },
    handleSubmit,
    register,
  } = useForm<FormData>({ defaultValues: { email: searchParams.get('email') || '' } })

  const onSubmit = useCallback(
    async (data: FormData) => {
      try {
        await login(data)
        router.push(redirect)
      } catch (_) {
        setError('There was an error with the credentials provided. Please try again.')
      }
    },
    [login, redirect, router],
  )

  return (
    <form className="" onSubmit={handleSubmit(onSubmit)}>
      <Message className="classes.message" error={error} message={searchParams.get('notice') || undefined} />
      <div className="flex flex-col gap-8">
        <FormItem>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            {...register('email', { required: 'Email is required.' })}
          />
          {errors.email && <FormError message={errors.email.message} />}
        </FormItem>

        <FormItem>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            {...register('password', { required: 'Please provide a password.' })}
          />
          {errors.password && <FormError message={errors.password.message} />}
        </FormItem>

        <div className="text-primary/70 mb-6 prose prose-a:hover:text-primary dark:prose-invert">
          <p>
            Forgot your password?{' '}
            <Link href={`/forgot-password${allParams}`}>Click here to reset it</Link>
          </p>
        </div>
      </div>

      <div className="flex gap-4 justify-between">
        <Button asChild variant="outline" size="lg">
          <Link href={`/create-account${allParams}`} className="grow max-w-[50%]">
            Create an account
          </Link>
        </Button>
        <Button className="grow" disabled={isLoading} size="lg" type="submit" variant="default">
          {isLoading ? 'Processing' : 'Continue'}
        </Button>
      </div>

      {googleEnabled && (
        <>
          <div className="my-7 flex items-center gap-3 text-xs uppercase tracking-[0.16em] text-primary/45">
            <span className="h-px flex-1 bg-primary/10" />
            Or
            <span className="h-px flex-1 bg-primary/10" />
          </div>
          <Button asChild className="w-full" size="lg" type="button" variant="outline">
            <a href={`/auth/google?returnTo=${encodeURIComponent(redirect)}`}>
              <Chrome className="mr-2 size-4" />
              Continue with Google
            </a>
          </Button>
        </>
      )}
    </form>
  )
}
