'use client'

import { Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import React, { useCallback, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'

import { FormError } from '@/components/forms/FormError'
import { FormItem } from '@/components/forms/FormItem'
import { Message } from '@/components/Message'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getSafeInternalPath } from '@/lib/auth/safe-redirect'
import { useAuth } from '@/providers/Auth'

type FormData = {
  acceptedTerms: boolean
  email: string
  firstName: string
  lastName: string
  password: string
  passwordConfirm: string
}

export const CreateAccountForm = () => {
  const { create } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnTo = getSafeInternalPath(searchParams.get('returnTo'))
  const [error, setError] = useState<null | string>(null)
  const [showPassword, setShowPassword] = useState(false)
  const googleEnabled = process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === 'true'
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    setValue,
    watch,
  } = useForm<FormData>({ defaultValues: { acceptedTerms: false } })
  const password = useRef('')
  password.current = watch('password', '')

  const onSubmit = useCallback(
    async (data: FormData) => {
      try {
        setError(null)
        const result = await create(data)
        router.push(result.redirectTo || '/check-email')
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : 'Unable to create the account.')
      }
    },
    [create, router],
  )

  return (
    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
      <Message error={error} />
      <div className="grid gap-5 sm:grid-cols-2">
        <FormItem>
          <Label htmlFor="firstName">First name</Label>
          <Input autoComplete="given-name" id="firstName" {...register('firstName', { required: 'First name is required.' })} />
          {errors.firstName && <FormError message={errors.firstName.message} />}
        </FormItem>
        <FormItem>
          <Label htmlFor="lastName">Last name <span className="text-primary/50">(optional)</span></Label>
          <Input autoComplete="family-name" id="lastName" {...register('lastName')} />
        </FormItem>
      </div>
      <FormItem>
        <Label htmlFor="email">Email</Label>
        <Input autoComplete="email" id="email" type="email" {...register('email', { required: 'Email is required.' })} />
        {errors.email && <FormError message={errors.email.message} />}
      </FormItem>
      <FormItem>
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input
            autoComplete="new-password"
            className="pr-12"
            id="password"
            type={showPassword ? 'text' : 'password'}
            {...register('password', { required: 'Password is required.', minLength: { value: 12, message: 'Use at least 12 characters.' } })}
          />
          <button aria-label={showPassword ? 'Hide passwords' : 'Show passwords'} className="absolute inset-y-0 right-0 grid w-11 place-items-center" onClick={() => setShowPassword((value) => !value)} type="button">
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        {errors.password && <FormError message={errors.password.message} />}
        <p className="text-xs text-primary/60">Use 12+ characters. Long passphrases are welcome.</p>
      </FormItem>
      <FormItem>
        <Label htmlFor="passwordConfirm">Confirm password</Label>
        <Input
          autoComplete="new-password"
          id="passwordConfirm"
          type={showPassword ? 'text' : 'password'}
          {...register('passwordConfirm', {
            required: 'Confirm your password.',
            validate: (value) => value === password.current || 'The passwords do not match.',
          })}
        />
        {errors.passwordConfirm && <FormError message={errors.passwordConfirm.message} />}
      </FormItem>
      <div className="flex items-start gap-3">
        <Checkbox
          aria-describedby="terms-help"
          id="acceptedTerms"
          onCheckedChange={(checked) => setValue('acceptedTerms', checked === true, { shouldValidate: true })}
        />
        <Label className="font-normal leading-5" htmlFor="acceptedTerms">
          I accept the <Link className="underline" href="/terms">terms</Link> and <Link className="underline" href="/privacy">privacy policy</Link>.
        </Label>
      </div>
      <input
        type="hidden"
        {...register('acceptedTerms', { validate: (value) => value || 'You must accept the terms.' })}
      />
      {errors.acceptedTerms && <FormError message={errors.acceptedTerms.message} />}
      <Button className="w-full" disabled={isSubmitting} size="lg" type="submit">
        {isSubmitting ? 'Creating account…' : 'Create account'}
      </Button>
      {googleEnabled && (
        <>
          <div className="flex items-center gap-3 text-xs uppercase tracking-[0.16em] text-primary/45">
            <span className="h-px flex-1 bg-primary/10" />Or<span className="h-px flex-1 bg-primary/10" />
          </div>
          <Button asChild className="w-full" size="lg" variant="outline">
            <a href={`/api/auth/google?returnTo=${encodeURIComponent(returnTo)}`}>Continue with Google</a>
          </Button>
          <p className="text-xs text-primary/60">Continuing with Google means you accept the terms and privacy policy.</p>
        </>
      )}
      <p className="text-center text-sm">Already have an account? <Link className="underline" href="/login">Sign in</Link></p>
    </form>
  )
}
