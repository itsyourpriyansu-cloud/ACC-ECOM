import { OrderStatus } from '@/components/OrderStatus'
import { Price } from '@/components/Price'
import { Button } from '@/components/ui/button'
import { Order } from '@/payload-types'
import { formatDateTime } from '@/utilities/formatDateTime'
import Link from 'next/link'

type Props = {
  order: Order
}

export const OrderItem: React.FC<Props> = ({ order }) => {
  const itemsLabel = order.items?.length === 1 ? 'Item' : 'Items'

  return (
    <div className="flex flex-col gap-8 rounded-lg border bg-card px-4 py-4 sm:flex-row sm:items-center sm:justify-between md:px-6">
      <div className="flex flex-col gap-4">
        <h3 className="max-w-32 truncate font-mono text-sm uppercase tracking-widest text-primary/50 sm:max-w-none">
          #{order.orderNumber || order.id}
        </h3>
        <div className="flex flex-col-reverse gap-4 sm:flex-row sm:items-center">
          <time className="text-xl" dateTime={order.createdAt}>
            {formatDateTime({ date: order.createdAt, format: 'MMMM dd, yyyy' })}
          </time>
          {order.status ? <OrderStatus status={order.status} /> : null}
        </div>
        <div className="flex gap-2 text-xs text-primary/80">
          <span>{order.items?.length || 0} {itemsLabel}</span>
          {typeof order.amount === 'number' ? <Price as="span" amount={order.amount} currencyCode={order.currency || 'INR'} /> : null}
        </div>
      </div>
      <Button asChild className="self-start sm:self-auto" variant="outline">
        <Link href={`/orders/${order.id}`}>View Order</Link>
      </Button>
    </div>
  )
}
