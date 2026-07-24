import type { Metadata } from 'next'

import { SecurityForm } from '@/components/forms/SecurityForm'

export const metadata: Metadata = { title: 'Account security' }

export default function SecurityPage() {
  return (
    <section className="rounded-2xl border border-alemah-sand/60 bg-[#fffdfa] p-6 sm:p-8">
      <h1 className="mb-8 font-serif text-4xl text-alemah-espresso">Security</h1>
      <SecurityForm />
    </section>
  )
}
