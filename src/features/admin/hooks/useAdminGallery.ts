import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../auth/hooks/useAuth'
import type { GalleryItem } from '../../gallery/types'
import type { GalleryMetadataOutput } from '../../gallery/galleryValidation'
import {
  deleteGalleryItem,
  getAllGalleryItems,
  getNextDisplayOrder,
  publishGalleryItem,
  replaceGalleryImage,
  setGalleryFeatured,
  toGalleryError,
  unpublishGalleryItem,
  updateGalleryMetadata,
  uploadGalleryItem,
  GalleryError,
} from '../services/adminGalleryService'

export interface UseAdminGalleryReturn {
  items: GalleryItem[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  mutating: boolean
  mutationError: string | null
  successMessage: string | null
  uploadProgress: number | null
  uploadAction: (
    file: Blob,
    metadata: GalleryMetadataOutput,
    uploadedBy: string,
  ) => Promise<string>
  updateMetadataAction: (
    galleryItemId: string,
    metadata: GalleryMetadataOutput,
  ) => Promise<void>
  replaceImageAction: (
    galleryItemId: string,
    file: Blob,
  ) => Promise<void>
  publishAction: (galleryItemId: string) => Promise<void>
  unpublishAction: (galleryItemId: string) => Promise<void>
  setFeaturedAction: (
    galleryItemId: string,
    isFeatured: boolean,
    featuredUntil?: string,
  ) => Promise<void>
  deleteAction: (galleryItemId: string) => Promise<void>
  getSuggestedDisplayOrder: () => Promise<number>
}

export function useAdminGallery(): UseAdminGalleryReturn {
  const { isAdmin, initializing } = useAuth()
  const [items, setItems] = useState<GalleryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mutating, setMutating] = useState(false)
  const [mutationError, setMutationError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getAllGalleryItems()
      setItems(data)
    } catch (err: unknown) {
      setError(toGalleryError(err).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (initializing) return
    if (!isAdmin) {
      setItems([])
      setLoading(false)
      setError('You do not have permission to manage gallery items.')
      return
    }
    void refresh()
  }, [refresh, isAdmin, initializing])

  const runMutation = useCallback(
    async <T,>(action: () => Promise<T>, success: string): Promise<T> => {
      setMutating(true)
      setMutationError(null)
      setSuccessMessage(null)
      try {
        const result = await action()
        setSuccessMessage(success)
        return result
      } catch (err: unknown) {
        const galleryError: GalleryError = toGalleryError(err)
        setMutationError(galleryError.message)
        throw galleryError
      } finally {
        setMutating(false)
        setUploadProgress(null)
      }
    },
    [],
  )

  const uploadAction = useCallback(
    (file: Blob, metadata: GalleryMetadataOutput, uploadedBy: string) =>
      runMutation(async () => {
        setUploadProgress(0)
        const id = await uploadGalleryItem({
          file,
          metadata,
          uploadedBy,
          onProgress: setUploadProgress,
        })
        const data = await getAllGalleryItems()
        setItems(data)
        return id
      }, 'Photo uploaded successfully'),
    [runMutation],
  )

  const updateMetadataAction = useCallback(
    (galleryItemId: string, metadata: GalleryMetadataOutput) =>
      runMutation(async () => {
        await updateGalleryMetadata({ galleryItemId, metadata })
        setItems((prev) =>
          prev.map((item) =>
            item.galleryItemId === galleryItemId
              ? {
                  ...item,
                  title: metadata.title,
                  description: metadata.description ?? '',
                  category: metadata.category,
                  displayOrder: metadata.displayOrder,
                  isPublished: metadata.isPublished,
                  isFeatured: metadata.isFeatured,
                  updatedAt: new Date(),
                }
              : item,
          ),
        )
      }, 'Gallery item updated successfully'),
    [runMutation],
  )

  const replaceImageAction = useCallback(
    (galleryItemId: string, file: Blob) =>
      runMutation(async () => {
        setUploadProgress(0)
        await replaceGalleryImage(galleryItemId, file, setUploadProgress)
        await refresh()
      }, 'Image replaced successfully'),
    [runMutation, refresh],
  )

  const publishAction = useCallback(
    (galleryItemId: string) =>
      runMutation(async () => {
        await publishGalleryItem(galleryItemId)
        setItems((prev) =>
          prev.map((item) =>
            item.galleryItemId === galleryItemId
              ? { ...item, isPublished: true, updatedAt: new Date() }
              : item,
          ),
        )
      }, 'Photo published — it will appear on the website.'),
    [runMutation],
  )

  const unpublishAction = useCallback(
    (galleryItemId: string) =>
      runMutation(async () => {
        await unpublishGalleryItem(galleryItemId)
        setItems((prev) =>
          prev.map((item) =>
            item.galleryItemId === galleryItemId
              ? { ...item, isPublished: false, updatedAt: new Date() }
              : item,
          ),
        )
      }, 'Photo unpublished — hidden from the website.'),
    [runMutation],
  )

  const setFeaturedAction = useCallback(
    (galleryItemId: string, isFeatured: boolean, featuredUntil?: string) =>
      runMutation(async () => {
        await setGalleryFeatured(galleryItemId, isFeatured, featuredUntil)
        await refresh()
      }, isFeatured ? 'Photo marked as featured.' : 'Featured status removed.'),
    [runMutation, refresh],
  )

  const deleteAction = useCallback(
    (galleryItemId: string) =>
      runMutation(async () => {
        await deleteGalleryItem(galleryItemId)
        setItems((prev) => prev.filter((i) => i.galleryItemId !== galleryItemId))
      }, 'Gallery item deleted successfully'),
    [runMutation],
  )

  const getSuggestedDisplayOrder = useCallback(
    () => getNextDisplayOrder(),
    [],
  )

  return useMemo(
    () => ({
      items,
      loading,
      error,
      refresh,
      mutating,
      mutationError,
      successMessage,
      uploadProgress,
      uploadAction,
      updateMetadataAction,
      replaceImageAction,
      publishAction,
      unpublishAction,
      setFeaturedAction,
      deleteAction,
      getSuggestedDisplayOrder,
    }),
    [
      items,
      loading,
      error,
      refresh,
      mutating,
      mutationError,
      successMessage,
      uploadProgress,
      uploadAction,
      updateMetadataAction,
      replaceImageAction,
      publishAction,
      unpublishAction,
      setFeaturedAction,
      deleteAction,
      getSuggestedDisplayOrder,
    ],
  )
}
