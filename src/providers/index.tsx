'use client'

import { AuthProvider } from '@/providers/Auth'
import { useAuth } from '@/providers/Auth'
import { EcommerceProvider, useEcommerce } from '@payloadcms/plugin-ecommerce/client/react'
import { phonePeAdapterClient } from '@/payments/phonepe'
import React, { useEffect } from 'react'
import type { SafeUser } from '@/lib/auth/types'

import { HeaderThemeProvider } from './HeaderTheme'
import { ThemeProvider } from './Theme'
import { SonnerProvider } from '@/providers/Sonner'

/**
 * Payload's commerce provider keeps its own customer/cart state. Keep it in
 * step with the storefront login so a guest cart becomes the signed-in
 * customer's cart immediately after authentication.
 */
const EcommerceAuthSync: React.FC = () => {
  const { status } = useAuth()
  const { onLogin } = useEcommerce()

  useEffect(() => {
    if (status === 'loggedIn') {
      // Commerce hydration can still be in flight when the customer logs out.
      // Treat that expected 401/403 race as a stale refresh, not an unhandled
      // browser rejection; the next authenticated transition hydrates again.
      void onLogin().catch(() => undefined)
    }
  }, [onLogin, status])

  return null
}

export const Providers: React.FC<{
  children: React.ReactNode
  initialUser?: null | SafeUser
}> = ({ children, initialUser }) => {
  return (
    <ThemeProvider>
      <AuthProvider initialUser={initialUser}>
        <HeaderThemeProvider>
          <SonnerProvider />
          <EcommerceProvider
            enableVariants={true}
            currenciesConfig={{
              defaultCurrency: 'INR',
              supportedCurrencies: [
                {
                  code: 'INR',
                  decimals: 2,
                  label: 'Indian Rupee',
                  symbol: '₹',
                  symbolDisplay: 'symbol',
                },
              ],
            }}
            api={{
              cartsFetchQuery: {
                depth: 2,
                populate: {
                  products: {
                    priceInINR: true,
                    slug: true,
                    title: true,
                    gallery: true,
                    inventory: true,
                  },
                  variants: {
                    priceInINR: true,
                    title: true,
                    inventory: true,
                  },
                },
              },
            }}
            paymentMethods={[phonePeAdapterClient()]}
          >
            <EcommerceAuthSync />
            {children}
          </EcommerceProvider>
        </HeaderThemeProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
