import type { Metadata } from 'next'

import { RenderParams } from '@/components/RenderParams'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import React from 'react'
import { headers as getHeaders } from 'next/headers'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { CreateAccountForm } from '@/components/forms/CreateAccountForm'
import { redirect } from 'next/navigation'

export default async function CreateAccount() {
  const headers = await getHeaders()
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers })

  if (user) {
    redirect(`/account?warning=${encodeURIComponent('You are already logged in.')}`)
  }

  return (
    <div className="container py-12 sm:py-16">
      <div className="mx-auto max-w-xl rounded-2xl border border-alemah-sand/60 bg-[#fffdfa] p-6 shadow-sm sm:p-9">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-alemah-red-600">Your Alemah</p>
      <h1 className="mt-2 font-serif text-4xl text-alemah-espresso">Create your account</h1>
      <p className="mb-8 mt-3 text-sm leading-6 text-alemah-taupe">Save addresses, revisit favourites, and follow every order.</p>
      <RenderParams />
      <CreateAccountForm />
      </div>
    </div>
  )
}

export const metadata: Metadata = {
  description: 'Create an account or log in to your existing account.',
  openGraph: mergeOpenGraph({
    title: 'Account',
    url: '/signup',
  }),
  title: 'Create account',
}
