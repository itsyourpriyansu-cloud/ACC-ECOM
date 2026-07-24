import type { ReactNode } from 'react'
import type { Metadata } from 'next'

import { AdminBar } from '@/components/AdminBar'
import { LivePreviewListener } from '@/components/LivePreviewListener'
import { Providers } from '@/providers'
import { InitTheme } from '@/providers/Theme/InitTheme'
import React from 'react'
import './globals.css'

// Alemah layout components (migrated from AMH-ECC)
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import CartDrawer from '@/components/Cart/CartDrawer'
import MobileTabBar from '@/components/MobileTabBar'
import { ToastContainer } from '@/components/ToastContainer'
import { PWARegistration } from '@/components/PWARegistration'
import { getCurrentUser } from '@/lib/auth/current-user'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'),
  title: {
    default: 'Alemah — Premium Home Textiles',
    template: '%s | Alemah',
  },
  description:
    'Premium bedsheets, cushion covers, quilts, comforters, curtains, and table linen. Woven with absolute craftsmanship, direct from our looms to your home.',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Alemah',
  },
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const current = await getCurrentUser()

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <InitTheme />
        <link href="/favicon.ico" rel="icon" sizes="32x32" />
        <link href="/alemah-icon.svg" rel="icon" type="image/svg+xml" />
        <link href="/alemah-icon-180.png" rel="apple-touch-icon" sizes="180x180" />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Providers initialUser={current?.safe || null}>
          <PWARegistration />
          <AdminBar />
          <LivePreviewListener />

          {/* Toast notifications */}
          <ToastContainer />

          {/* Sticky header */}
          <Header />

          {/* Page content */}
          <main className="flex-1 flex flex-col w-full pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0">{children}</main>

          {/* Footer (desktop) */}
          <Footer />

          {/* Cart Drawer overlay */}
          <CartDrawer />

          {/* Mobile tab bar */}
          <MobileTabBar />
        </Providers>
      </body>
    </html>
  )
}
