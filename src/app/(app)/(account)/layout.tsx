import type { ReactNode } from 'react'

import { RenderParams } from '@/components/RenderParams'
import { AccountNav } from '@/components/AccountNav'
import { getCurrentUser } from '@/lib/auth/current-user'
import { redirect } from 'next/navigation'

export default async function RootLayout({ children }: { children: ReactNode }) {
  const current = await getCurrentUser()
  if (!current) {
    redirect(`/login?returnTo=${encodeURIComponent('/account')}`)
  }

  return (
    <div>
      <div className="container">
        <RenderParams className="" />
      </div>

      <div className="container mt-8 flex gap-8 pb-28 md:mt-16 md:pb-8">
        <AccountNav className="max-w-62 grow flex-col items-start gap-4 hidden md:flex" />

        <div className="flex flex-col gap-12 grow">{children}</div>
      </div>
    </div>
  )
}
