'use client'

import { Media } from '@/components/Media'
import { Message } from '@/components/Message'
import { Price } from '@/components/Price'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/providers/Auth'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React, { useCallback, useEffect, useState } from 'react'

import { useAddresses, useCart, usePayments } from '@payloadcms/plugin-ecommerce/client/react'
import { CheckoutAddresses } from '@/components/checkout/CheckoutAddresses'
import { CreateAddressModal } from '@/components/addresses/CreateAddressModal'
import { Address } from '@/payload-types'
import { Checkbox } from '@/components/ui/checkbox'
import { AddressItem } from '@/components/addresses/AddressItem'
import { FormItem } from '@/components/forms/FormItem'
import { toast } from 'sonner'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { CheckoutProgress } from '@/components/checkout/CheckoutProgress'

export const CheckoutPage: React.FC = () => {
  const { user } = useAuth()
  const router = useRouter()
  const { cart } = useCart()
  const [error, setError] = useState<null | string>(null)
  /**
   * State to manage the email input for guest checkout.
   */
  const [email, setEmail] = useState('')
  const [emailEditable, setEmailEditable] = useState(true)
  const { initiatePayment } = usePayments()
  const { addresses } = useAddresses()
  const [shippingAddress, setShippingAddress] = useState<Partial<Address>>()
  const [billingAddress, setBillingAddress] = useState<Partial<Address>>()
  const [billingAddressSameAsShipping, setBillingAddressSameAsShipping] = useState(true)
  const [isProcessingPayment, setProcessingPayment] = useState(false)

  const cartIsEmpty = !cart || !cart.items || !cart.items.length

  const contactReady = Boolean(email || user)
  const canGoToPayment = Boolean(
    (email || user) && billingAddress && (billingAddressSameAsShipping || shippingAddress),
  )

  // On initial load wait for addresses to be loaded and check to see if we can prefill a default one
  useEffect(() => {
    if (!shippingAddress) {
      if (addresses && addresses.length > 0) {
        const defaultAddress = addresses[0]
        if (defaultAddress) {
          setBillingAddress(defaultAddress)
        }
      }
    }
  }, [addresses])

  useEffect(() => {
    return () => {
      setShippingAddress(undefined)
      setBillingAddress(undefined)
      setBillingAddressSameAsShipping(true)
      setEmail('')
      setEmailEditable(true)
    }
  }, [])

  const startPhonePeCheckout = useCallback(
    async () => {
      try {
        setProcessingPayment(true)
        setError(null)
        const paymentData = (await initiatePayment('phonepe', {
          additionalData: {
            ...(email ? { customerEmail: email } : {}),
            billingAddress,
            shippingAddress: billingAddressSameAsShipping ? billingAddress : shippingAddress,
          },
        })) as Record<string, unknown>

        const checkoutURL = paymentData?.checkoutURL
        if (typeof checkoutURL !== 'string') {
          throw new Error('PhonePe did not return a payment link.')
        }

        window.sessionStorage.setItem('alemah-phonepe-email', email || user?.email || '')
        window.location.assign(checkoutURL)
      } catch (error) {
        const errorMessage =
          error instanceof Error && error.message.includes('PhonePe client credentials')
            ? 'PhonePe payments are not activated yet.'
            : 'Unable to start your PhonePe payment. Please try again.'

        setError(errorMessage)
        toast.error(errorMessage)
        setProcessingPayment(false)
      }
    },
    [billingAddress, billingAddressSameAsShipping, email, initiatePayment, shippingAddress, user?.email],
  )

  if (cartIsEmpty && isProcessingPayment) {
    return (
      <div className="py-12 w-full items-center justify-center">
        <div className="prose dark:prose-invert text-center max-w-none self-center mb-8">
          <p>Processing your payment...</p>
        </div>
        <LoadingSpinner />
      </div>
    )
  }

  if (cartIsEmpty) {
    return (
      <div className="my-10 grid w-full place-items-center rounded-2xl border border-alemah-sand/60 bg-alemah-cream/25 px-6 py-16 text-center">
        <div>
          <p className="font-serif text-3xl text-alemah-espresso">Your bag is waiting.</p>
          <p className="mt-2 text-sm text-alemah-taupe">Choose a curtain to begin a secure checkout.</p>
          <Link className="mt-6 inline-flex rounded-full bg-alemah-red-600 px-5 py-3 text-sm font-semibold text-white" href="/shop">Browse curtains</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="my-4 flex grow flex-col items-stretch justify-stretch gap-8 pb-28 md:my-8 md:pb-8 lg:flex-row lg:gap-10">
      <div className="basis-full lg:basis-2/3 flex flex-col gap-8 justify-stretch">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-alemah-red-600">Secure checkout</p>
          <h1 className="mt-2 font-serif text-4xl tracking-tight text-alemah-espresso">A calm way to check out.</h1>
        </div>
        <CheckoutProgress addressReady={Boolean(billingAddress && (billingAddressSameAsShipping || shippingAddress))} contactReady={contactReady} />
        <section className="rounded-2xl border border-alemah-sand/55 bg-[#fffdfa] p-5 sm:p-7">
        <h2 className="font-serif text-3xl text-alemah-espresso">Contact</h2>
        {!user && (
          <div className="mt-5 flex flex-col gap-3 rounded-xl border border-alemah-sand/50 bg-alemah-cream/35 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div><p className="font-semibold text-alemah-espresso">Already shopped with us?</p><p className="text-sm text-alemah-taupe">Sign in to use your saved address and see your orders.</p></div>
            <div className="flex shrink-0 gap-3"><Button asChild className="border-alemah-sand bg-[#fffdfa]" variant="outline"><Link href="/login?redirect=/checkout">Sign in</Link></Button><Link className="self-center text-sm font-semibold text-alemah-red-600 underline" href="/create-account?redirect=/checkout">Create account</Link></div>
          </div>
        )}
        {user ? (
          <div className="mt-5 rounded-xl border border-alemah-sand/50 bg-alemah-cream/35 p-4">
            <div>
              <p>{user.email}</p>{' '}
              <p>
                Not you?{' '}
                <Link className="underline" href="/logout">
                  Log out
                </Link>
              </p>
            </div>
          </div>
        ) : (
          <div className="mt-5 rounded-xl border border-alemah-sand/50 bg-alemah-cream/35 p-4">
            <div>
              <p className="mb-4 text-sm text-alemah-taupe">Or continue as a guest. We’ll only use this for your order updates.</p>

              <FormItem className="mb-6">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  disabled={!emailEditable}
                  id="email"
                  name="email"
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  type="email"
                />
              </FormItem>

              <Button
                disabled={!email || !emailEditable}
                onClick={(e) => {
                  e.preventDefault()
                  setEmailEditable(false)
                }}
                className="rounded-full bg-alemah-red-600 text-white hover:bg-alemah-red-700"
                variant="default"
              >
                Continue as guest
              </Button>
            </div>
          </div>
        )}
        </section>

        <section className="rounded-2xl border border-alemah-sand/55 bg-[#fffdfa] p-5 sm:p-7">
        <h2 className="font-serif text-3xl text-alemah-espresso">Delivery address</h2>
        <p className="mt-2 text-sm text-alemah-taupe">We’ll use this address for delivery updates and your order receipt.</p>

        {billingAddress ? (
          <div>
            <AddressItem
              actions={
                <Button
                  variant={'outline'}
                  disabled={isProcessingPayment}
                  onClick={(e) => {
                    e.preventDefault()
                    setBillingAddress(undefined)
                  }}
                >
                  Remove
                </Button>
              }
              address={billingAddress}
            />
          </div>
        ) : user ? (
          <CheckoutAddresses heading="Billing address" setAddress={setBillingAddress} />
        ) : (
          <CreateAddressModal
            disabled={!email || Boolean(emailEditable)}
            callback={(address) => {
              setBillingAddress(address)
            }}
            skipSubmission={true}
          />
        )}

        <div className="mt-6 flex gap-4 items-center">
          <Checkbox
            id="shippingTheSameAsBilling"
            checked={billingAddressSameAsShipping}
            disabled={isProcessingPayment || (!user && (!email || Boolean(emailEditable)))}
            onCheckedChange={(state) => {
              setBillingAddressSameAsShipping(state as boolean)
            }}
          />
          <Label htmlFor="shippingTheSameAsBilling">Shipping is the same as billing</Label>
        </div>

        {!billingAddressSameAsShipping && (
          <>
            {shippingAddress ? (
              <div>
                <AddressItem
                  actions={
                    <Button
                      variant={'outline'}
                      disabled={isProcessingPayment}
                      onClick={(e) => {
                        e.preventDefault()
                        setShippingAddress(undefined)
                      }}
                    >
                      Remove
                    </Button>
                  }
                  address={shippingAddress}
                />
              </div>
            ) : user ? (
              <CheckoutAddresses
                heading="Shipping address"
                description="Please select a shipping address."
                setAddress={setShippingAddress}
              />
            ) : (
              <CreateAddressModal
                callback={(address) => {
                  setShippingAddress(address)
                }}
                disabled={!email || Boolean(emailEditable)}
                skipSubmission={true}
              />
            )}
          </>
        )}
        </section>

        <section className="rounded-2xl border border-alemah-sand/55 bg-alemah-cream/20 p-5 sm:p-7">
        <div className="flex items-start justify-between gap-5"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-alemah-red-600">Payment</p><h2 className="mt-1 font-serif text-3xl text-alemah-espresso">Pay securely</h2><p className="mt-2 text-sm text-alemah-taupe">You will be taken to PhonePe to complete payment. We do not store card or UPI details.</p></div></div>
        {process.env.NEXT_PUBLIC_PHONEPE_ENABLED === 'true' ? (
          <Button
            className="mt-5 min-h-12 rounded-full bg-alemah-red-600 px-6 text-white hover:bg-alemah-red-700"
            disabled={!canGoToPayment || isProcessingPayment}
            onClick={(e) => {
              e.preventDefault()
              void startPhonePeCheckout()
            }}
          >
            {isProcessingPayment ? 'Opening PhonePe...' : 'Pay securely with PhonePe'}
          </Button>
        ) : (
          <p className="mt-5 rounded-xl border border-alemah-sand bg-[#fffdfa] p-4 text-sm text-alemah-taupe">
            PhonePe payments are being connected. Checkout will open once the merchant account is activated.
          </p>
        )}

        {error && (
          <div className="my-8">
            <Message error={error} />

            <Button
              onClick={(e) => {
                e.preventDefault()
                router.refresh()
              }}
              variant="default"
            >
              Try again
            </Button>
          </div>
        )}
        </section>

      </div>

      {!cartIsEmpty && (
        <aside className="basis-full self-start rounded-2xl border border-alemah-sand/55 bg-alemah-cream/25 p-5 sm:p-7 lg:sticky lg:top-24 lg:basis-1/3">
          <h2 className="font-serif text-3xl text-alemah-espresso">Your bag</h2>
          <p className="mt-1 text-sm text-alemah-taupe">Review your selected curtains.</p>
          <div className="mt-6 flex flex-col gap-5">
          {cart?.items?.map((item, index) => {
            if (typeof item.product === 'object' && item.product) {
              const {
                product,
                product: { id, meta, title, gallery },
                quantity,
                variant,
              } = item

              if (!quantity) return null

              let image = gallery?.[0]?.image || meta?.image
              let price = product?.priceInINR

              const isVariant = Boolean(variant) && typeof variant === 'object'

              if (isVariant) {
                price = variant?.priceInINR

                const imageVariant = product.gallery?.find((item: any) => {
                  if (!item.variantOption) return false
                  const variantOptionID =
                    typeof item.variantOption === 'object'
                      ? item.variantOption.id
                      : item.variantOption

                  const hasMatch = variant?.options?.some((option: any) => {
                    if (typeof option === 'object') return option.id === variantOptionID
                    else return option === variantOptionID
                  })

                  return hasMatch
                })

                if (imageVariant && typeof imageVariant.image !== 'string') {
                  image = imageVariant.image
                }
              }

              return (
                <div className="flex items-start gap-4" key={index}>
                  <div className="flex items-stretch justify-stretch h-20 w-20 p-2 rounded-lg border">
                    <div className="relative w-full h-full">
                      {image && typeof image !== 'string' && (
                        <Media className="" fill imgClassName="rounded-lg" resource={image} />
                      )}
                    </div>
                  </div>
                  <div className="flex grow justify-between items-center">
                    <div className="flex flex-col gap-1">
                      <p className="font-medium text-lg">{title}</p>
                      {variant && typeof variant === 'object' && (
                        <p className="text-sm font-mono text-primary/50 tracking-widest">
                          {variant.options
                            ?.map((option: any) => {
                              if (typeof option === 'object') return option.label
                              return null
                            })
                            .join(', ')}
                        </p>
                      )}
                      <div>
                        {'x'}
                        {quantity}
                      </div>
                    </div>

                    {typeof price === 'number' && <Price amount={price} currencyCode="INR" />}
                  </div>
                </div>
              )
            }
            return null
          })}
          </div>
          <hr className="my-6 border-alemah-sand/50" />
          <div className="flex justify-between items-center gap-2">
            <span className="uppercase">Total</span>{' '}
            <Price className="text-3xl font-medium" amount={cart.subtotal || 0} currencyCode="INR" />
          </div>
        </aside>
      )}
    </div>
  )
}
