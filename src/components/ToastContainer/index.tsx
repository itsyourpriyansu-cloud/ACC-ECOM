'use client'

import { useUIStore } from '@/store/useUIStore'
import { CheckCircle, AlertTriangle, AlertCircle, Info, X } from 'lucide-react'

export function ToastContainer() {
  const toasts = useUIStore((state) => state.toasts)
  const removeToast = useUIStore((state) => state.removeToast)

  return (
    <div className="fixed top-4 right-4 sm:top-6 sm:right-6 z-[100] flex flex-col gap-2.5 max-w-md w-[calc(100vw-32px)] sm:w-80">
      {toasts.map((toast) => {
        let Icon = Info
        let colorClass = 'border-alemah-sand bg-background/95 text-alemah-espresso'
        let iconColor = 'text-alemah-red-600'

        if (toast.type === 'success') {
          Icon = CheckCircle
          colorClass = 'border-ios-green/30 bg-background/95'
          iconColor = 'text-ios-green'
        } else if (toast.type === 'error') {
          Icon = AlertCircle
          colorClass = 'border-ios-red/30 bg-background/95'
          iconColor = 'text-ios-red'
        } else if (toast.type === 'warning') {
          Icon = AlertTriangle
          colorClass = 'border-ios-yellow/30 bg-background/95'
          iconColor = 'text-ios-yellow'
        }

        return (
          <div
            key={toast.id}
            className={`p-3.5 rounded-xl border shadow-md flex gap-3 items-start animate-slide-up font-sans text-xs ${colorClass}`}
          >
            <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${iconColor}`} />
            <span className="flex-1 font-medium text-alemah-espresso leading-normal">
              {toast.message}
            </span>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-alemah-taupe hover:text-alemah-espresso shrink-0 p-0.5 hover:bg-alemah-sand/10 rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
