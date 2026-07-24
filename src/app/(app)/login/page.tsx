import type { Metadata } from 'next'

import { RenderParams } from '@/components/RenderParams'
import React from 'react'

import { headers as getHeaders } from 'next/headers'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { LoginForm } from '@/components/forms/LoginForm'
import { redirect } from 'next/navigation'

export default async function Login() {
  const headers = await getHeaders()
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers })

  if (user) {
    redirect(`/account?warning=${encodeURIComponent('You are already logged in.')}`)
  }

  return (
    <div className="container py-12 sm:py-16">
      <div className="max-w-xl mx-auto rounded-2xl border border-alemah-sand/60 bg-[#fffdfa] p-6 shadow-sm sm:p-9">
        <RenderParams />
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-alemah-red-600">Welcome back</p>
        <h1 className="mt-2 font-serif text-4xl text-alemah-espresso">Sign in</h1>
        <p className="mb-8 mt-3 text-sm leading-6 text-alemah-taupe">Access your saved spaces, addresses, and orders.</p>
        <LoginForm />
      </div>
    </div>
  )
}

export const metadata: Metadata = {
  description: 'Login or create an account to get started.',
  openGraph: {
    title: 'Login',
    url: '/login',
  },
  title: 'Login',
}
