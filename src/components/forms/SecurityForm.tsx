'use client'

import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'

import { FormError } from '@/components/forms/FormError'
import { FormItem } from '@/components/forms/FormItem'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/providers/Auth'

type FormData = { currentPassword: string; password: string; passwordConfirm: string }

export const SecurityForm = () => {
  const { logout, user } = useAuth()
  const router = useRouter()
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const password = useRef('')
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    watch,
  } = useForm<FormData>()
  password.current = watch('password', '')

  return (
    <div className="space-y-9">
      <div>
        <h2 className="font-serif text-2xl text-alemah-espresso">Sign-in methods</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-full border border-alemah-sand px-3 py-1 text-sm">
            Password: {user?.hasLocalPassword ? 'connected' : 'not set'}
          </span>
          <span className="rounded-full border border-alemah-sand px-3 py-1 text-sm">
            Google: {user?.authMethods.includes('google') ? 'connected' : 'not connected'}
          </span>
        </div>
      </div>
      <form
        className="max-w-xl space-y-5"
        onSubmit={handleSubmit(async (data) => {
          setError('')
          setMessage('')
          const response = await fetch('/api/auth/password', {
            body: JSON.stringify(data),
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            method: 'POST',
          })
          const result = (await response.json().catch(() => ({}))) as {
            message?: string
            redirectTo?: string
          }
          if (!response.ok) {
            setError(result.message || 'Unable to update the password.')
            return
          }
          setMessage(result.message || 'Password updated.')
          if (result.redirectTo) {
            router.replace(`${result.redirectTo}?notice=${encodeURIComponent(result.message || 'Password updated.')}`)
            router.refresh()
          }
        })}
      >
        <h2 className="font-serif text-2xl text-alemah-espresso">
          {user?.hasLocalPassword ? 'Change password' : 'Set a password'}
        </h2>
        {user?.hasLocalPassword && (
          <FormItem>
            <Label htmlFor="currentPassword">Current password</Label>
            <Input autoComplete="current-password" id="currentPassword" type="password" {...register('currentPassword', { required: 'Current password is required.' })} />
            {errors.currentPassword && <FormError message={errors.currentPassword.message} />}
          </FormItem>
        )}
        <FormItem>
          <Label htmlFor="newPassword">New password</Label>
          <Input autoComplete="new-password" id="newPassword" type="password" {...register('password', { required: 'New password is required.', minLength: { value: 12, message: 'Use at least 12 characters.' } })} />
          {errors.password && <FormError message={errors.password.message} />}
        </FormItem>
        <FormItem>
          <Label htmlFor="confirmPassword">Confirm new password</Label>
          <Input autoComplete="new-password" id="confirmPassword" type="password" {...register('passwordConfirm', { required: 'Confirm the password.', validate: (value) => value === password.current || 'The passwords do not match.' })} />
          {errors.passwordConfirm && <FormError message={errors.passwordConfirm.message} />}
        </FormItem>
        {message && <p aria-live="polite" className="text-sm text-emerald-700">{message}</p>}
        {error && <p aria-live="polite" className="text-sm text-red-700">{error}</p>}
        <Button disabled={isSubmitting} type="submit">{isSubmitting ? 'Updating…' : user?.hasLocalPassword ? 'Change password' : 'Set password'}</Button>
      </form>
      <div className="border-t border-alemah-sand/60 pt-8">
        <h2 className="font-serif text-2xl text-alemah-espresso">Sessions</h2>
        <p className="mt-2 text-sm text-alemah-taupe">Sign out here, or revoke every Payload and Google application session.</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button
            onClick={async () => {
              await logout()
              window.location.assign('/')
            }}
            type="button"
            variant="outline"
          >
            Log out on this device
          </Button>
          <Button
            onClick={async () => {
              const response = await fetch('/api/auth/logout-all', { method: 'POST' })
              if (response.ok) {
                router.replace('/login?notice=All sessions have been revoked.')
                router.refresh()
              } else {
                setError('Unable to revoke all sessions.')
              }
            }}
            type="button"
            variant="destructive"
          >
            Log out from all devices
          </Button>
        </div>
      </div>
    </div>
  )
}
