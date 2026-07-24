'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'

import { FormError } from '@/components/forms/FormError'
import { FormItem } from '@/components/forms/FormItem'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { SafeUser } from '@/lib/auth/types'
import { useAuth } from '@/providers/Auth'

type FormData = Pick<SafeUser, 'firstName'> & {
  avatarURL: string
  displayName: string
  lastName: string
}

export const AccountForm = () => {
  const { setUser, user } = useAuth()
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const {
    formState: { errors, isDirty, isSubmitting },
    handleSubmit,
    register,
    reset,
  } = useForm<FormData>()

  useEffect(() => {
    if (!user) return
    reset({
      avatarURL: user.avatarURL || '',
      displayName: user.displayName || '',
      firstName: user.firstName,
      lastName: user.lastName || '',
    })
  }, [reset, user])

  return (
    <form
      className="max-w-xl space-y-6"
      onSubmit={handleSubmit(async (data) => {
        setError('')
        setMessage('')
        const response = await fetch('/api/auth/profile', {
          body: JSON.stringify(data),
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          method: 'PATCH',
        })
        const result = (await response.json().catch(() => ({}))) as {
          message?: string
          user?: SafeUser
        }
        if (!response.ok || !result.user) {
          setError(result.message || 'Unable to update the profile.')
          return
        }
        setUser(result.user)
        reset({
          avatarURL: result.user.avatarURL || '',
          displayName: result.user.displayName || '',
          firstName: result.user.firstName,
          lastName: result.user.lastName || '',
        })
        setMessage('Profile updated.')
      })}
    >
      {message && <p aria-live="polite" className="text-sm text-emerald-700">{message}</p>}
      {error && <p aria-live="polite" className="text-sm text-red-700">{error}</p>}
      <div className="grid gap-5 sm:grid-cols-2">
        <FormItem>
          <Label htmlFor="firstName">First name</Label>
          <Input autoComplete="given-name" id="firstName" {...register('firstName', { required: 'First name is required.' })} />
          {errors.firstName && <FormError message={errors.firstName.message} />}
        </FormItem>
        <FormItem>
          <Label htmlFor="lastName">Last name</Label>
          <Input autoComplete="family-name" id="lastName" {...register('lastName')} />
        </FormItem>
      </div>
      <FormItem>
        <Label htmlFor="displayName">Display name</Label>
        <Input autoComplete="name" id="displayName" {...register('displayName')} />
      </FormItem>
      <FormItem>
        <Label htmlFor="email">Email</Label>
        <Input autoComplete="email" disabled id="email" readOnly type="email" value={user?.email || ''} />
        <p className="text-xs text-alemah-taupe">Email changes require support-assisted verification.</p>
      </FormItem>
      <FormItem>
        <Label htmlFor="avatarURL">Avatar image URL</Label>
        <Input id="avatarURL" inputMode="url" placeholder="https://…" {...register('avatarURL')} />
      </FormItem>
      <Button disabled={!isDirty || isSubmitting} type="submit">
        {isSubmitting ? 'Saving…' : 'Save profile'}
      </Button>
    </form>
  )
}
