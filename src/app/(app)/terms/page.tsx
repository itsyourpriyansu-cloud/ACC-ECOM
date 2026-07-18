import { InfoPage } from '@/components/info/InfoPage'

export const metadata = { title: 'Terms of Service' }

export default function TermsPage() {
  return (
    <InfoPage
      eyebrow="Alemah policies"
      title="Terms of service"
      sections={[
        {
          title: 'Preview notice',
          body: <p>This page is a pre-launch placeholder and is not a final contract. It needs legal approval, business identity details, pricing terms and jurisdiction information before the public store goes live.</p>,
        },
        {
          title: 'Products and availability',
          body: <p>Product photography, dimensions, colours and availability are shown as accurately as possible, but the final approved catalogue and inventory rules will govern any completed order.</p>,
        },
        {
          title: 'Orders and payments',
          body: <p>An order should be accepted only after a configured payment provider has confirmed payment. Delivery, cancellation, return and refund rules must be published here before checkout is enabled for customers.</p>,
        },
      ]}
    />
  )
}
