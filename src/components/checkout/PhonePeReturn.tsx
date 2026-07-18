'use client'

import { Button } from '@/components/ui/button'
import { usePayments } from '@payloadcms/plugin-ecommerce/client/react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

export function PhonePeReturn() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { confirmOrder } = usePayments()
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState('Confirming your PhonePe payment...')
  const merchantOrderID = searchParams.get('merchantOrderID')

  useEffect(() => {
    if (!merchantOrderID) {
      setError('This PhonePe return link is incomplete.')
      return
    }

    const confirmPayment = async () => {
      try {
        const customerEmail = window.sessionStorage.getItem('alemah-phonepe-email') || undefined
        const result = (await confirmOrder('phonepe', {
          additionalData: { customerEmail, merchantOrderID },
        })) as { accessToken?: string; orderID?: number | string }

        if (!result.orderID) throw new Error('PhonePe did not return an order confirmation.')

        window.sessionStorage.removeItem('alemah-phonepe-email')
        const query = customerEmail
          ? `?email=${encodeURIComponent(customerEmail)}${result.accessToken ? `&accessToken=${encodeURIComponent(result.accessToken)}` : ''}`
          : result.accessToken
            ? `?accessToken=${encodeURIComponent(result.accessToken)}`
            : ''
        router.replace(`/orders/${result.orderID}${query}`)
      } catch {
        setStatus('We could not confirm the payment yet.')
        setError('If you completed payment, wait a moment and try again. Your card or UPI account will not be charged twice.')
      }
    }

    void confirmPayment()
  }, [confirmOrder, merchantOrderID, router])

  return (
    <div className="mx-auto flex min-h-[50vh] w-full max-w-xl flex-col items-center justify-center gap-5 px-5 text-center">
      <h1 className="font-serif text-3xl text-alemah-espresso">{status}</h1>
      {error ? <p className="max-w-md text-sm leading-6 text-alemah-taupe">{error}</p> : null}
      {error ? (
        <Button asChild variant="outline">
          <Link href="/checkout">Return to checkout</Link>
        </Button>
      ) : null}
    </div>
  )
}
