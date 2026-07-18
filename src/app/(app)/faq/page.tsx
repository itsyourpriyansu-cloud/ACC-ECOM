import { InfoPage } from '@/components/info/InfoPage'

export const metadata = { title: 'Help & FAQ' }

export default function FAQPage() {
  return (
    <InfoPage
      eyebrow="Alemah support"
      title="Questions, answered simply."
      sections={[
        {
          title: 'Choosing the right curtain size',
          body: <p>Measure the width of your curtain rod, then choose curtains with a combined width of about 1.5 to 2 times that measurement for a naturally full fall. The fit finder on our home page gives you a quick starting point.</p>,
        },
        {
          title: 'Fabric, light and care',
          body: <p>Every product page shows the fabric, light-filtering level, header style and care guidance available for that listing. Please check those details before ordering, especially when matching a specific room or rod type.</p>,
        },
        {
          title: 'Orders and delivery',
          body: <p>Once ordering and dispatch are enabled, your account will show the current order status. You will also be able to use the order-tracking page with the order details sent after purchase.</p>,
        },
        {
          title: 'Returns and exchanges',
          body: <p>Returns, exchanges, delivery windows and eligibility rules will be confirmed in the final store policy before public launch. Do not rely on this preview for a purchase decision.</p>,
        },
      ]}
    />
  )
}
