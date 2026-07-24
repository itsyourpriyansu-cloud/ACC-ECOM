import type { Metadata } from 'next'

import { AccountForm } from '@/components/forms/AccountForm'

export const metadata: Metadata = { title: 'Profile' }

export default function ProfilePage() {
  return (
    <section className="rounded-2xl border border-alemah-sand/60 bg-[#fffdfa] p-6 sm:p-8">
      <h1 className="mb-8 font-serif text-4xl text-alemah-espresso">Profile</h1>
      <AccountForm />
    </section>
  )
}
