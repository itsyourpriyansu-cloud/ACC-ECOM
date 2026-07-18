import { Check } from 'lucide-react'

type CheckoutProgressProps = {
  addressReady: boolean
  contactReady: boolean
}

export function CheckoutProgress({ addressReady, contactReady }: CheckoutProgressProps) {
  const steps = [
    { complete: true, label: 'Bag', number: '1' },
    { complete: contactReady && addressReady, label: 'Delivery', number: '2' },
    { complete: false, label: 'Pay', number: '3' },
  ]

  return (
    <ol aria-label="Checkout progress" className="grid grid-cols-3 gap-2 border-y border-alemah-sand/45 py-4">
      {steps.map((step, index) => (
        <li className="flex items-center gap-2 text-xs font-semibold text-alemah-taupe" key={step.label}>
          <span className={`grid h-6 w-6 place-items-center rounded-full text-[11px] ${step.complete ? 'bg-alemah-red-600 text-white' : 'border border-alemah-sand bg-[#fffdfa] text-alemah-taupe'}`}>
            {step.complete && index < 2 ? <Check size={14} /> : step.number}
          </span>
          <span>{step.label}</span>
        </li>
      ))}
    </ol>
  )
}
