'use client'

import { FormError } from '@/components/forms/FormError'
import { FormItem } from '@/components/forms/FormItem'
import { Message } from '@/components/Message'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import React, { Fragment, useCallback, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useAuth } from '@/providers/Auth'

type FormData = {
  email: string
}

export const ForgotPasswordForm: React.FC = () => {
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const { forgotPassword } = useAuth()

  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<FormData>()

  const onSubmit = useCallback(async (data: FormData) => {
    try {
      await forgotPassword(data)
      setSuccess(true)
      setError('')
    } catch {
      setError(
        'There was a problem while attempting to send you a password reset email. Please try again.',
      )
    }
  }, [forgotPassword])

  return (
    <Fragment>
      {!success && (
        <React.Fragment>
          <h1 className="text-xl mb-4">Forgot Password</h1>
          <div className="prose dark:prose-invert mb-8">
            <p>
              Enter your email and we will send reset instructions if the account can receive them.
            </p>
          </div>
          <form className="max-w-lg" onSubmit={handleSubmit(onSubmit)}>
            <Message className="mb-8" error={error} />

            <FormItem className="mb-8">
              <Label htmlFor="email" className="mb-2">
                Email address
              </Label>
              <Input
                id="email"
                autoComplete="email"
                {...register('email', { required: 'Please provide your email.' })}
                type="email"
              />
              {errors.email && <FormError message={errors.email.message} />}
            </FormItem>

            <Button type="submit" variant="default">
              Send reset link
            </Button>
          </form>
        </React.Fragment>
      )}
      {success && (
        <React.Fragment>
          <h1 className="text-xl mb-4">Request submitted</h1>
          <div className="prose dark:prose-invert">
            <p>Check your email for a link that will allow you to securely reset your password.</p>
          </div>
        </React.Fragment>
      )}
    </Fragment>
  )
}
