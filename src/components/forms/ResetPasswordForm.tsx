'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'

import { FormError } from '@/components/forms/FormError'
import { FormItem } from '@/components/forms/FormItem'
import { Message } from '@/components/Message'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/providers/Auth'

type FormData = { password: string; passwordConfirm: string }

export const ResetPasswordForm = () => {
  const token = useSearchParams().get('token') || ''
  const router = useRouter()
  const { resetPassword } = useAuth()
  const [error, setError] = useState<null | string>(null)
  const password = useRef('')
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    watch,
  } = useForm<FormData>()
  password.current = watch('password', '')

  if (!token) {
    return <p>This reset link is incomplete. <Link className="underline" href="/forgot-password">Request a new link.</Link></p>
  }

  return (
    <form
      className="space-y-6"
      onSubmit={handleSubmit(async (data) => {
        try {
          setError(null)
          await resetPassword({ ...data, token })
          router.replace('/login?notice=Password updated. Sign in with your new password.')
        } catch (caught) {
          setError(caught instanceof Error ? caught.message : 'Unable to reset the password.')
        }
      })}
    >
      <Message error={error} />
      <FormItem>
        <Label htmlFor="password">New password</Label>
        <Input autoComplete="new-password" id="password" type="password" {...register('password', { required: 'Password is required.', minLength: { value: 12, message: 'Use at least 12 characters.' } })} />
        {errors.password && <FormError message={errors.password.message} />}
      </FormItem>
      <FormItem>
        <Label htmlFor="passwordConfirm">Confirm new password</Label>
        <Input autoComplete="new-password" id="passwordConfirm" type="password" {...register('passwordConfirm', { required: 'Confirm the password.', validate: (value) => value === password.current || 'The passwords do not match.' })} />
        {errors.passwordConfirm && <FormError message={errors.passwordConfirm.message} />}
      </FormItem>
      <Button className="w-full" disabled={isSubmitting} type="submit">
        {isSubmitting ? 'Updating…' : 'Set new password'}
      </Button>
    </form>
  )
}
