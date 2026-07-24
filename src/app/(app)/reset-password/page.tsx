import type { Metadata } from 'next'

import { ResetPasswordForm } from '@/components/forms/ResetPasswordForm'

export const metadata: Metadata = { title: 'Reset password' }

export default function ResetPasswordPage() {
  return (
    <div className="container py-16">
      <section className="mx-auto max-w-xl rounded-2xl border border-alemah-sand/60 bg-[#fffdfa] p-7 sm:p-10">
        <h1 className="font-serif text-4xl text-alemah-espresso">Choose a new password</h1>
        <p className="mb-8 mt-3 text-sm leading-6 text-alemah-taupe">Use a unique password or a long passphrase you do not use elsewhere.</p>
        <ResetPasswordForm />
      </section>
    </div>
  )
}
