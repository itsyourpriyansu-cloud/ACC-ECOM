import type {
  PaymentAdapter,
  PaymentAdapterArgs,
  PaymentAdapterClient,
  PaymentAdapterClientArgs,
} from '@payloadcms/plugin-ecommerce/types'
import type { DefaultDocumentIDType } from 'payload'
import type { Cart, Order, Transaction } from '@/payload-types'

type PhonePeAdapterArgs = {
  clientID?: string
  clientSecret?: string
  clientVersion?: string
  environment?: 'sandbox' | 'production'
  redirectBaseURL?: string
} & PaymentAdapterArgs

type PhonePeResponse = Record<string, unknown>

type PhonePeCartItem = {
  product?: DefaultDocumentIDType | { id: DefaultDocumentIDType } | null
  quantity: number
  variant?: DefaultDocumentIDType | { id: DefaultDocumentIDType }
}

type PhonePePayload = {
  create: {
    (args: { collection: 'orders'; data: object; req: unknown }): Promise<Order>
    (args: { collection: 'transactions'; data: object; req: unknown }): Promise<Transaction>
  }
  find: (args: { collection: 'transactions'; depth: number; req: unknown; where: object }) => Promise<{ docs: Transaction[] }>
  update: (args: { collection: 'carts' | 'transactions'; data: object; id: DefaultDocumentIDType; req: unknown }) => Promise<Cart | Transaction>
}

const getValue = (value: unknown, keys: string[]): string | undefined => {
  if (!value || typeof value !== 'object') return undefined

  const record = value as PhonePeResponse
  for (const key of keys) {
    const candidate = record[key]
    if (typeof candidate === 'string' && candidate) return candidate
  }

  return undefined
}

const getPhonePeBaseURL = (environment: PhonePeAdapterArgs['environment']) =>
  environment === 'production'
    ? 'https://api.phonepe.com/apis/pg'
    : 'https://api-preprod.phonepe.com/apis/pg-sandbox'

const getAccessToken = async (props: PhonePeAdapterArgs) => {
  const { clientID, clientSecret, clientVersion, environment } = props

  if (!clientID || !clientSecret || !clientVersion) {
    throw new Error('PhonePe client credentials are not configured.')
  }

  const response = await fetch(`${getPhonePeBaseURL(environment)}/v1/oauth/token`, {
    body: new URLSearchParams({
      client_id: clientID,
      client_secret: clientSecret,
      client_version: clientVersion,
      grant_type: 'client_credentials',
    }),
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    method: 'POST',
  })

  const body = (await response.json().catch(() => ({}))) as PhonePeResponse
  const accessToken = getValue(body, ['access_token', 'accessToken'])

  if (!response.ok || !accessToken) {
    throw new Error('PhonePe could not authenticate this merchant account.')
  }

  return accessToken
}

const flattenCartItems = (items: PhonePeCartItem[] = []) =>
  items.flatMap((item) => {
    if (!item.product) return []

    return [{
      ...(item.variant ? { variant: typeof item.variant === 'object' ? item.variant.id : item.variant } : {}),
      product: typeof item.product === 'object' ? item.product.id : item.product,
      quantity: item.quantity,
    }]
  })

const getCheckoutURL = (response: PhonePeResponse) =>
  getValue(response, ['redirectUrl', 'paymentUrl']) ||
  getValue(response.data, ['redirectUrl', 'paymentUrl'])

const getPaymentState = (response: PhonePeResponse) =>
  getValue(response, ['state', 'status', 'paymentState']) ||
  getValue(response.data, ['state', 'status', 'paymentState'])

const getPhonePeTransactionID = (response: PhonePeResponse) =>
  getValue(response, ['transactionId', 'paymentId']) ||
  getValue(response.data, ['transactionId', 'paymentId'])

export const phonePeAdapter = (props: PhonePeAdapterArgs): PaymentAdapter => {
  const label = props.label || 'PhonePe'
  const redirectBaseURL = props.redirectBaseURL?.replace(/\/$/, '')

  return {
    confirmOrder: async ({ cartsSlug = 'carts', data, ordersSlug = 'orders', req, transactionsSlug = 'transactions' }) => {
      const payload = req.payload as unknown as PhonePePayload
      const merchantOrderID = data.merchantOrderID

      if (!merchantOrderID || typeof merchantOrderID !== 'string') {
        throw new Error('A PhonePe merchant order ID is required.')
      }

      const transactions = await payload.find({
        collection: transactionsSlug as 'transactions',
        depth: 0,
        req,
        where: { 'phonepe.merchantOrderID': { equals: merchantOrderID } },
      })
      const transaction = transactions.docs[0]

      if (!transaction) throw new Error('PhonePe payment transaction was not found.')
      if (transaction.order) {
        const orderID = typeof transaction.order === 'object' ? transaction.order.id : transaction.order
        return { message: 'Order was already confirmed.', orderID, transactionID: transaction.id }
      }

      const accessToken = await getAccessToken(props)
      const statusResponse = await fetch(
        `${getPhonePeBaseURL(props.environment)}/checkout/v2/order/${encodeURIComponent(merchantOrderID)}/status`,
        { headers: { Authorization: `O-Bearer ${accessToken}`, 'Content-Type': 'application/json' } },
      )
      const statusPayload = (await statusResponse.json().catch(() => ({}))) as PhonePeResponse
      const paymentState = getPaymentState(statusPayload)?.toUpperCase()

      if (!statusResponse.ok || !['COMPLETED', 'SUCCESS'].includes(paymentState || '')) {
        throw new Error('PhonePe has not confirmed this payment yet.')
      }

      const order = await payload.create({
        collection: ordersSlug as 'orders',
        data: {
          amount: transaction.amount,
          currency: transaction.currency,
          ...(req.user ? { customer: req.user.id } : { customerEmail: transaction.customerEmail }),
          items: transaction.items,
          shippingAddress: transaction.phonepe?.shippingAddress || transaction.billingAddress,
          status: 'processing',
          transactions: [transaction.id],
        },
        req,
      })

      const cartID = typeof transaction.cart === 'object' ? transaction.cart?.id : transaction.cart
      if (!cartID) throw new Error('PhonePe payment transaction does not reference a cart.')

      await payload.update({
        collection: cartsSlug as 'carts',
        data: { purchasedAt: new Date().toISOString(), status: 'purchased' },
        id: cartID,
        req,
      })
      await payload.update({
        collection: transactionsSlug as 'transactions',
        data: {
          order: order.id,
          phonepe: { phonePeTransactionID: getPhonePeTransactionID(statusPayload) },
          status: 'succeeded',
        },
        id: transaction.id,
        req,
      })

      return {
        accessToken: order.accessToken,
        message: 'PhonePe payment confirmed.',
        orderID: order.id,
        transactionID: transaction.id,
      }
    },
    group: {
      admin: { condition: (data) => data?.paymentMethod === 'phonepe' },
      fields: [
        { name: 'merchantOrderID', type: 'text', required: true },
        { name: 'phonePeTransactionID', type: 'text', admin: { readOnly: true } },
        { name: 'shippingAddress', type: 'json', admin: { readOnly: true } },
      ],
      name: 'phonepe',
      type: 'group',
    },
    initiatePayment: async ({ data, req, transactionsSlug = 'transactions' }) => {
      const payload = req.payload as unknown as PhonePePayload
      const cart = data.cart
      const customerEmail = data.customerEmail
      const amount = cart?.subtotal

      if (!redirectBaseURL) throw new Error('PhonePe redirect URL is not configured.')
      if (!cart?.id || !Array.isArray(cart.items) || cart.items.length === 0) {
        throw new Error('Your cart is empty.')
      }
      if (!customerEmail || typeof customerEmail !== 'string') {
        throw new Error('A customer email is required to pay with PhonePe.')
      }
      if (!amount || typeof amount !== 'number' || amount <= 0) {
        throw new Error('A valid order total is required to pay with PhonePe.')
      }

      const merchantOrderID = `AHM-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
      const transaction = await payload.create({
        collection: transactionsSlug as 'transactions',
        data: {
          ...(req.user ? { customer: req.user.id } : { customerEmail }),
          amount,
          billingAddress: data.billingAddress,
          cart: cart.id,
          currency: 'INR',
          items: flattenCartItems(cart.items),
          paymentMethod: 'phonepe',
          phonepe: { merchantOrderID, shippingAddress: data.shippingAddress as unknown as Record<string, unknown> },
          status: 'pending',
        },
        req,
      })

      try {
        const accessToken = await getAccessToken(props)
        const response = await fetch(`${getPhonePeBaseURL(props.environment)}/checkout/v2/pay`, {
          body: JSON.stringify({
            amount,
            expireAfter: 1200,
            merchantOrderId: merchantOrderID,
            metaInfo: { udf1: String(cart.id), udf2: String(transaction.id) },
            paymentFlow: {
              merchantUrls: {
                redirectUrl: `${redirectBaseURL}/checkout/phonepe/return?merchantOrderID=${encodeURIComponent(merchantOrderID)}`,
              },
              message: 'Payment for your Alemah order',
              type: 'PG_CHECKOUT',
            },
          }),
          headers: { Authorization: `O-Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          method: 'POST',
        })
        const body = (await response.json().catch(() => ({}))) as PhonePeResponse
        const checkoutURL = getCheckoutURL(body)

        if (!response.ok || !checkoutURL) {
          throw new Error('PhonePe did not return a checkout URL.')
        }

        return { checkoutURL, merchantOrderID, message: 'PhonePe payment initiated.' }
      } catch (error) {
        await payload.update({
          collection: transactionsSlug as 'transactions',
          data: { status: 'failed' },
          id: transaction.id,
          req,
        })
        throw error
      }
    },
    label,
    name: 'phonepe',
  }
}

export const phonePeAdapterClient = (props?: PaymentAdapterClientArgs): PaymentAdapterClient => ({
  confirmOrder: true,
  initiatePayment: true,
  label: props?.label || 'PhonePe',
  name: 'phonepe',
})
