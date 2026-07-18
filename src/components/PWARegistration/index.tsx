'use client'

import { useEffect } from 'react'

export function PWARegistration() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    if (process.env.NODE_ENV !== 'production') {
      void navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => void registration.unregister())
      })
      return
    }

    void navigator.serviceWorker.register('/sw.js').catch(() => {
      // Offline support is progressive enhancement. The storefront remains usable online.
    })
  }, [])

  return null
}
