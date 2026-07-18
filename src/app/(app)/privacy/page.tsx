import { InfoPage } from '@/components/info/InfoPage'

export const metadata = { title: 'Privacy Policy' }

export default function PrivacyPage() {
  return (
    <InfoPage
      eyebrow="Alemah policies"
      title="Privacy policy"
      sections={[
        {
          title: 'Preview notice',
          body: <p>This is a pre-launch policy placeholder. It must be reviewed and replaced with an approved legal policy, company details and support contact before the storefront accepts public orders.</p>,
        },
        {
          title: 'Account and order data',
          body: <p>The store uses customer account information to provide sign-in, order history and order support. Payment details must be handled only by the configured payment provider and are not stored in the storefront database.</p>,
        },
        {
          title: 'Your choices',
          body: <p>Before launch, this policy will state the process for account access, correction, deletion requests, marketing preferences, cookies and any third-party service providers.</p>,
        },
      ]}
    />
  )
}
