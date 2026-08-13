import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import GalleryGrid from '../components/GalleryGrid'
import type { GalleryItem } from '../types'

const sampleItem: GalleryItem = {
  galleryItemId: 'g1',
  title: 'Balayage',
  description: '',
  category: 'hair',
  imageUrl: 'https://example.com/photo.webp',
  provider: 'cloudinary',
  providerKey: 'makeng-gallery/g1',
  storagePath: 'makeng-gallery/g1',
  isPublished: true,
  displayOrder: 0,
  uploadedBy: 'admin-1',
  createdAt: new Date(),
  updatedAt: new Date(),
  isFeatured: false,
}

describe('GalleryGrid', () => {
  it('shows loading skeletons', () => {
    render(<GalleryGrid items={[]} loading skeletonCount={3} />)
    expect(screen.getByLabelText(/Loading gallery/i)).toBeInTheDocument()
  })

  it('shows empty state when no items', () => {
    render(<GalleryGrid items={[]} loading={false} />)
    expect(screen.getByText(/coming soon/i)).toBeInTheDocument()
  })

  it('shows error message', () => {
    render(<GalleryGrid items={[]} loading={false} error="Failed" />)
    expect(screen.getByRole('alert')).toHaveTextContent(/temporarily unavailable/i)
  })

  it('renders published items with alt text', () => {
    render(<GalleryGrid items={[sampleItem]} loading={false} />)
    expect(screen.getByRole('img', { name: 'Balayage' })).toBeInTheDocument()
  })

  it('shows featured badge when item is featured', () => {
    render(
      <GalleryGrid
        items={[{ ...sampleItem, isFeatured: true }]}
        loading={false}
      />,
    )
    expect(screen.getByText('Featured')).toBeInTheDocument()
  })
})

describe('GalleryError', () => {
  it('maps permission errors', async () => {
    const { toGalleryError, GalleryError } = await import(
      '../../admin/services/adminGalleryService'
    )
    const err = toGalleryError({ code: 'permission-denied' })
    expect(err).toBeInstanceOf(GalleryError)
    expect(err.code).toBe('PERMISSION_DENIED')
  })
})

describe('parseFeaturedUntil', () => {
  it('parses ISO date strings', async () => {
    const { parseFeaturedUntil } = await import('../galleryMetadataHelpers')
    const date = parseFeaturedUntil('2026-12-31')
    expect(date?.getFullYear()).toBe(2026)
    expect(date?.getMonth()).toBe(11)
  })
})
