'use client'

import { AuthProvider } from '@/providers/Auth'
import { useAuth } from '@/providers/Auth'
import { EcommerceProvider, useEcommerce } from '@payloadcms/plugin-ecommerce/client/react'
import { phonePeAdapterClient } from '@/payments/phonepe'
import React, { useEffect } from 'react'

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
      void onLogin()
    }
  }, [onLogin, status])

  return null
}

export const Providers: React.FC<{
  children: React.ReactNode
}> = ({ children }) => {
  return (
    <ThemeProvider>
      <AuthProvider>
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
