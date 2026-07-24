import type { Metadata } from 'next'
import Link from 'next/link'

import { ResendVerificationForm } from '@/components/forms/ResendVerificationForm'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = { title: 'Check your email' }

export default function CheckEmailPage() {
  return (
    <div className="container py-16">
      <section className="mx-auto max-w-xl rounded-2xl border border-alemah-sand/60 bg-[#fffdfa] p-7 sm:p-10">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-alemah-red-600">Almost there</p>
        <h1 className="mt-2 font-serif text-4xl text-alemah-espresso">Check your email</h1>
        <p className="mt-4 leading-7 text-alemah-taupe">
          Open the verification link we sent before signing in. The link can only be used once.
        </p>
        <Button asChild className="mt-7">
          <Link href="/login">Return to sign in</Link>
        </Button>
        <ResendVerificationForm />
      </section>
    </div>
  )
}
