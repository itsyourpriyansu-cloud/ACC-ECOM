import type { CollectionConfig } from 'payload'
import { createShiprocketOrder, isShiprocketConfigured } from '@/shipping/shiprocket'

/**
 * Extensions to Payload Ecommerce's built-in Orders collection.
 *
 * The ecommerce plugin owns the payment, customer, items, amount, currency, and
 * transaction fields. Keep those default fields intact so its payment adapters
 * can create an order atomically after a verified payment.
 */
export const Orders: CollectionConfig = {
  slug: 'orders',
  admin: {
    defaultColumns: ['orderNumber', 'status', 'amount', 'currency', 'createdAt'],
    useAsTitle: 'orderNumber',
  },
  fields: [
    {
      name: 'orderNumber',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: { readOnly: true },
    },
    {
      name: 'fulfillmentStatus',
      type: 'select',
      defaultValue: 'pending',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Confirmed', value: 'confirmed' },
        { label: 'Shipped', value: 'shipped' },
        { label: 'Delivered', value: 'delivered' },
        { label: 'Returned', value: 'returned' },
      ],
      required: true,
    },
    {
      name: 'shiprocketShipmentId',
      type: 'text',
      admin: { readOnly: true },
    },
    {
      name: 'shiprocketOrderId',
      type: 'text',
      admin: { readOnly: true },
    },
    {
      name: 'shiprocketAwbCode',
      type: 'text',
      admin: { readOnly: true },
    },
    {
      name: 'shiprocketCourierName',
      type: 'text',
      admin: { readOnly: true },
    },
    {
      name: 'sendToShiprocket',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'After payment is confirmed, tick this and save to create the shipment in Shiprocket.',
      },
    },
  ],
  hooks: {
    beforeChange: [
      ({ data, operation, originalDoc }) => {
        if (operation === 'create' && !data.orderNumber) {
          data.orderNumber = `AHM-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`
        }
        if (data.sendToShiprocket && !originalDoc?.sendToShiprocket && !isShiprocketConfigured()) {
          throw new Error('Configure Shiprocket API credentials and pickup location before creating a shipment.')
        }
        return data
      },
    ],
    afterChange: [
      async ({ doc, operation, req }) => {
        if (operation !== 'update' || !doc.sendToShiprocket || doc.shiprocketShipmentId) return doc

        const payload: any = req.payload
        const order = await payload.findByID({
          collection: 'orders',
          depth: 1,
          id: doc.id,
          overrideAccess: true,
        })
        const shipment = await createShiprocketOrder(order)

        await payload.update({
          collection: 'orders',
          data: {
            fulfillmentStatus: 'confirmed',
            shiprocketAwbCode: shipment.awb_code || undefined,
            shiprocketCourierName: shipment.courier_name || undefined,
            shiprocketOrderId: String(shipment.order_id),
            shiprocketShipmentId: String(shipment.shipment_id),
          },
          id: doc.id,
          overrideAccess: true,
        })

        return doc
      },
    ],
  },
}
