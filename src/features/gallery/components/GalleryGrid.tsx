import { useState } from 'react'
import type { GalleryItem } from '../types'
import { isFeaturedActiveIncludingOpenEnded } from '../galleryService'

interface GalleryGridProps {
  items: GalleryItem[]
  loading?: boolean
  error?: string | null
  /** Max skeleton tiles while loading (default 6). */
  skeletonCount?: number
}

function GallerySkeleton({ count }: { count: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl aspect-square bg-gray-200 animate-pulse"
          aria-hidden="true"
        />
      ))}
    </>
  )
}

function GalleryImageTile({ item }: { item: GalleryItem }) {
  const [broken, setBroken] = useState(false)
  const featured = isFeaturedActiveIncludingOpenEnded(item)

  if (broken) {
    return (
      <div
        className="rounded-xl aspect-square bg-gray-100 flex flex-col items-center justify-center gap-1 px-2"
        role="img"
        aria-label={item.title}
      >
        <span className="text-gray-400 text-xs text-center">Image unavailable</span>
      </div>
    )
  }

  return (
    <figure className="group relative rounded-xl overflow-hidden aspect-square bg-gray-100">
      <img
        src={item.imageUrl}
        alt={item.title}
        loading="lazy"
        decoding="async"
        onError={() => setBroken(true)}
        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
      />
      {featured && (
        <span className="absolute top-2 left-2 rounded-full bg-purple-700/90 text-white text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5">
          Featured
        </span>
      )}
      <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-3 py-2 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
        <p className="text-white text-xs font-medium truncate">{item.title}</p>
      </figcaption>
    </figure>
  )
}

/**
 * Responsive gallery grid for the public Our Work section.
 */
export default function GalleryGrid({
  items,
  loading = false,
  error = null,
  skeletonCount = 6,
}: GalleryGridProps) {
  if (loading) {
    return (
      <div
        className="grid grid-cols-2 md:grid-cols-3 gap-3"
        aria-busy="true"
        aria-label="Loading gallery"
      >
        <GallerySkeleton count={skeletonCount} />
      </div>
    )
  }

  if (error) {
    return (
      <p className="text-center text-sm text-gray-500 py-8" role="alert">
        Gallery photos are temporarily unavailable.
      </p>
    )
  }

  if (items.length === 0) {
    return (
      <p className="text-center text-sm text-gray-400 py-8">
        New work photos coming soon.
      </p>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {items.map((item) => (
        <GalleryImageTile key={item.galleryItemId} item={item} />
      ))}
    </div>
  )
}
