'use client'

import { Button } from '@/components/ui/button'
import { useAuth } from '@/providers/Auth'
import { Heart } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

export function WishlistButton({ productID }: { productID: number }) {
  const { user } = useAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [wishlistID, setWishlistID] = useState<number | null>(null)

  useEffect(() => {
    if (!user) {
      setWishlistID(null)
      return
    }

    const loadWishlist = async () => {
      const response = await fetch(`/api/wishlists?where[product][equals]=${productID}&limit=1`, {
        credentials: 'include',
      })
      if (!response.ok) return
      const result = (await response.json()) as { docs?: Array<{ id: number }> }
      setWishlistID(result.docs?.[0]?.id || null)
    }

    void loadWishlist()
  }, [productID, user])

  const toggleWishlist = async () => {
    if (!user) {
      toast.info('Sign in to save products to your wishlist.')
      router.push('/login')
      return
    }

    setIsLoading(true)
    try {
      if (wishlistID) {
        const response = await fetch(`/api/wishlists/${wishlistID}`, {
          credentials: 'include',
          method: 'DELETE',
        })
        if (!response.ok) throw new Error('Unable to remove saved product.')
        setWishlistID(null)
        toast.success('Removed from your wishlist.')
      } else {
        const response = await fetch('/api/wishlists', {
          body: JSON.stringify({ product: productID }),
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          method: 'POST',
        })
        if (!response.ok) throw new Error('Unable to save product.')
        const result = (await response.json()) as { doc: { id: number } }
        setWishlistID(result.doc.id)
        toast.success('Saved to your wishlist.')
      }
    } catch {
      toast.error('We could not update your wishlist. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const isSaved = Boolean(wishlistID)

  return (
    <Button
      aria-label={isSaved ? 'Remove from wishlist' : 'Save to wishlist'}
      disabled={isLoading}
      onClick={toggleWishlist}
      type="button"
      variant="outline"
    >
      <Heart className={isSaved ? 'fill-current' : ''} size={17} />
      {isSaved ? 'Saved' : 'Save'}
    </Button>
  )
}
