'use client'

import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export const ResendVerificationForm = () => {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  return (
    <form
      className="mt-8 space-y-4 border-t border-alemah-sand/50 pt-7"
      onSubmit={async (event) => {
        event.preventDefault()
        setLoading(true)
        const response = await fetch('/api/auth/resend-verification', {
          body: JSON.stringify({ email }),
          headers: { 'Content-Type': 'application/json' },
          method: 'POST',
        })
        const result = (await response.json().catch(() => ({}))) as { message?: string }
        setMessage(result.message || 'If verification is needed, a new email will arrive shortly.')
        setLoading(false)
      }}
    >
      <Label htmlFor="verification-email">Need another email?</Label>
      <Input
        autoComplete="email"
        id="verification-email"
        onChange={(event) => setEmail(event.target.value)}
        required
        type="email"
        value={email}
      />
      <Button disabled={loading} type="submit" variant="outline">
        {loading ? 'Sending…' : 'Resend verification'}
      </Button>
      {message && <p aria-live="polite" className="text-sm text-alemah-taupe">{message}</p>}
    </form>
  )
}
