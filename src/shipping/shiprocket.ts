type Address = {
  addressLine1?: string | null
  addressLine2?: string | null
  city?: string | null
  country?: string | null
  firstName?: string | null
  lastName?: string | null
  phone?: string | null
  postalCode?: string | null
  state?: string | null
}

type ShiprocketOrder = {
  amount?: number | null
  customerEmail?: string | null
  id: number
  items?: Array<{
    product?: { priceInINR?: number | null; sku?: string | null; title?: string | null } | number | null
    quantity: number
  }> | null
  orderNumber: string
  shippingAddress?: Address | null
}

type ShiprocketResponse = {
  awb_code?: string
  courier_company_id?: number
  courier_name?: string
  order_id?: number
  shipment_id?: number
}

const baseURL = 'https://apiv2.shiprocket.in/v1/external'

const requiredConfig = ['SHIPROCKET_EMAIL', 'SHIPROCKET_PASSWORD', 'SHIPROCKET_PICKUP_LOCATION']

export const isShiprocketConfigured = () => requiredConfig.every((key) => Boolean(process.env[key]))

const getConfig = () => {
  if (!isShiprocketConfigured()) {
    throw new Error(`Shiprocket configuration missing: ${requiredConfig.filter((key) => !process.env[key]).join(', ')}.`)
  }

  return {
    breadth: Number(process.env.SHIPROCKET_PACKAGE_BREADTH_CM || 20),
    email: process.env.SHIPROCKET_EMAIL!,
    height: Number(process.env.SHIPROCKET_PACKAGE_HEIGHT_CM || 8),
    length: Number(process.env.SHIPROCKET_PACKAGE_LENGTH_CM || 30),
    password: process.env.SHIPROCKET_PASSWORD!,
    pickupLocation: process.env.SHIPROCKET_PICKUP_LOCATION!,
    weight: Number(process.env.SHIPROCKET_DEFAULT_WEIGHT_KG || 0.5),
  }
}

const getToken = async () => {
  const config = getConfig()
  const response = await fetch(`${baseURL}/auth/login`, {
    body: JSON.stringify({ email: config.email, password: config.password }),
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
  })
  const body = (await response.json().catch(() => ({}))) as { token?: string }

  if (!response.ok || !body.token) throw new Error('Shiprocket could not authenticate this API user.')

  return body.token
}

const toRupees = (amount?: number | null) => Number(((amount || 0) / 100).toFixed(2))

export async function createShiprocketOrder(order: ShiprocketOrder) {
  const config = getConfig()
  const address = order.shippingAddress

  if (!address?.firstName || !address.addressLine1 || !address.city || !address.state || !address.postalCode || !address.phone) {
    throw new Error('A complete shipping name, address, pincode, state, city and phone number are required for Shiprocket.')
  }

  const items = (order.items || []).map((item) => {
    const product = typeof item.product === 'object' ? item.product : undefined
    if (!product?.sku || !product.title || !item.quantity) {
      throw new Error('Every item needs a SKU, title and quantity before it can be sent to Shiprocket.')
    }

    return {
      discount: 0,
      name: product.title,
      selling_price: toRupees(product.priceInINR),
      sku: product.sku,
      units: item.quantity,
    }
  })

  if (items.length === 0) throw new Error('An order needs at least one item before it can be sent to Shiprocket.')

  const token = await getToken()
  const response = await fetch(`${baseURL}/orders/create/adhoc`, {
    body: JSON.stringify({
      billing_address: address.addressLine1,
      billing_address_2: address.addressLine2 || '',
      billing_city: address.city,
      billing_country: address.country === 'IN' ? 'India' : address.country || 'India',
      billing_customer_name: address.firstName,
      billing_email: order.customerEmail || '',
      billing_last_name: address.lastName || '',
      billing_phone: address.phone,
      billing_pincode: address.postalCode,
      billing_state: address.state,
      breadth: config.breadth,
      height: config.height,
      length: config.length,
      order_date: new Date().toISOString().slice(0, 19).replace('T', ' '),
      order_id: `ALM-${order.id}`,
      order_items: items,
      payment_method: 'Prepaid',
      pickup_location: config.pickupLocation,
      shipping_address: address.addressLine1,
      shipping_address_2: address.addressLine2 || '',
      shipping_city: address.city,
      shipping_country: address.country === 'IN' ? 'India' : address.country || 'India',
      shipping_customer_name: address.firstName,
      shipping_email: order.customerEmail || '',
      shipping_is_billing: true,
      shipping_last_name: address.lastName || '',
      shipping_phone: address.phone,
      shipping_pincode: address.postalCode,
      shipping_state: address.state,
      sub_total: toRupees(order.amount),
      weight: config.weight,
    }),
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    method: 'POST',
  })
  const body = (await response.json().catch(() => ({}))) as ShiprocketResponse

  if (!response.ok || !body.order_id || !body.shipment_id) {
    throw new Error('Shiprocket could not create this shipment. Check the pickup location and package details.')
  }

  return body
}
