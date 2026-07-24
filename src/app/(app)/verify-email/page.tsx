import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import configPromise from '@payload-config'
import { createLocalReq, getPayload, verifyEmailOperation } from 'payload'

import { trustedAuthContext } from '@/collections/Users/hooks/security'
import { writeAuthAudit } from '@/lib/auth/audit'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Verify email' }

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; token?: string }>
}) {
  const { status, token } = await searchParams
  if (token) {
    const payload = await getPayload({ config: configPromise })
    const matched = await payload.find({
      collection: 'users',
      depth: 0,
      limit: 1,
      overrideAccess: true,
      pagination: false,
      where: { _verificationToken: { equals: token } },
    })
    const user = matched.docs[0]
    try {
      if (!user) throw new Error('INVALID_TOKEN')
      const req = await createLocalReq({}, payload)
      req.context = { ...req.context, ...trustedAuthContext }
      await verifyEmailOperation({
        collection: payload.collections.users,
        req,
        token,
      })
      const methods = new Set(user.authMethods || [])
      if (user.hasLocalPassword || user.hash) methods.add('password')
      await payload.update({
        collection: 'users',
        context: trustedAuthContext,
        data: {
          authMethods: [...methods],
          emailVerifiedAt: new Date().toISOString(),
          hasLocalPassword: methods.has('password'),
        },
        id: user.id,
        overrideAccess: true,
      })
      await writeAuthAudit({
        event: 'email_verification_succeeded',
        payload,
        provider: 'password',
        success: true,
        user: user.id,
      })
      redirect('/verify-email?status=success')
    } catch (error) {
      if (error && typeof error === 'object' && 'digest' in error) throw error
      await writeAuthAudit({
        event: 'email_verification_failed',
        payload,
        provider: 'password',
        reasonCode: 'INVALID_TOKEN',
        success: false,
      })
      redirect('/verify-email?status=invalid')
    }
  }

  const success = status === 'success'
  return (
    <div className="container py-16">
      <section className="mx-auto max-w-xl rounded-2xl border border-alemah-sand/60 bg-[#fffdfa] p-7 sm:p-10">
        <h1 className="font-serif text-4xl text-alemah-espresso">
          {success ? 'Email verified' : 'Verification link unavailable'}
        </h1>
        <p className="mt-4 leading-7 text-alemah-taupe">
          {success
            ? 'Your email is confirmed. You can now sign in with your password.'
            : 'This link is invalid, expired, or has already been used. Request a new email from the check-email page.'}
        </p>
        <Button asChild className="mt-7">
          <Link href={success ? '/login' : '/check-email'}>
            {success ? 'Sign in' : 'Request another link'}
          </Link>
        </Button>
      </section>
    </div>
  )
}
