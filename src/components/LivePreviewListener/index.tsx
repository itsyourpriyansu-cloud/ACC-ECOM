'use client'
import { RefreshRouteOnSave as PayloadLivePreview } from '@payloadcms/live-preview-react'
import { useRouter } from 'next/navigation'
import React from 'react'

export const LivePreviewListener: React.FC = () => {
  const router = useRouter()
  const serverURL =
    process.env.NEXT_PUBLIC_SERVER_URL ||
    (typeof window === 'undefined' ? 'http://localhost:3000' : window.location.origin)

  return (
    <PayloadLivePreview
      refresh={router.refresh}
      serverURL={serverURL}
    />
  )
}
