import { PhonePeReturn } from '@/components/checkout/PhonePeReturn'
import { Suspense } from 'react'

export const metadata = { title: 'Confirming PhonePe payment' }

export default function PhonePeReturnPage() {
  return (
    <Suspense fallback={null}>
      <PhonePeReturn />
    </Suspense>
  )
}
