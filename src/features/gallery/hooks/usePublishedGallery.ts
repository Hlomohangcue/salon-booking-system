import { useCallback, useEffect, useState } from 'react'
import type { GalleryItem } from '../types'
import { getPublishedGalleryItems } from '../galleryService'

export interface UsePublishedGalleryReturn {
  items: GalleryItem[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

/** Loads published gallery items for the public site. */
export function usePublishedGallery(limit?: number): UsePublishedGalleryReturn {
  const [items, setItems] = useState<GalleryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getPublishedGalleryItems(limit)
      setItems(data)
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Unable to load gallery photos.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [limit])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return { items, loading, error, refresh }
}
