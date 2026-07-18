import { Order } from '@/payload-types'
import { cn } from '@/utilities/cn'

type Props = {
  status: Order['status']
  className?: string
}

export const OrderStatus: React.FC<Props> = ({ status, className }) => {
  return (
    <div
      className={cn(
        'text-xs tracking-widest font-mono uppercase py-1 px-2 rounded-full w-fit font-semibold border',
        className,
        {
          'bg-blue-500/10 text-blue-600 border-blue-500/20': status === 'processing',
          'bg-green-500/10 text-green-600 border-green-500/20': status === 'completed',
          'bg-red-500/10 text-red-600 border-red-500/20': status === 'cancelled' || status === 'refunded',
        },
      )}
    >
      {status?.replace('_', ' ')}
    </div>
  )
}
