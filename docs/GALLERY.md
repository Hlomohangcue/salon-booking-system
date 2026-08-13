# Gallery Management (Our Work) — Phase 4.6

Salon administrators upload portfolio photos via **Admin → Gallery**. Published items appear automatically on the homepage **Our Work** section.

---

## Architecture

```
Admin Gallery Page
  → useAdminGallery hook
  → adminGalleryService (Firestore + Storage)
  → gallery/{galleryItemId}/original.webp

HomePage Our Work
  → usePublishedGallery hook
  → galleryService.getPublishedGalleryItems()
  → Firestore query (isPublished == true)
```

Cloud Functions are **not** required for MVP uploads. Client-side Canvas compression produces WebP before upload.

---

## Firestore Schema

**Collection:** `galleryItems/{galleryItemId}`

| Field | Type | Notes |
|---|---|---|
| `galleryItemId` | string | Same as document ID |
| `title` | string | Required; used for alt text |
| `description` | string | Optional caption |
| `category` | string | `hair` \| `beard` \| `makeup` \| `treatment` \| `other` |
| `imageUrl` | string | Firebase Storage download URL |
| `storagePath` | string | e.g. `gallery/{id}/original.webp` |
| `isPublished` | boolean | Controls public visibility |
| `displayOrder` | number | Lower = first |
| `uploadedBy` | string | Admin Auth UID |
| `isFeatured` | boolean | Shown first on public grid |
| `featuredUntil` | Timestamp? | Optional featured end date |
| `mimeType` | string? | Usually `image/webp` |
| `fileSizeBytes` | number? | Post-compression size |
| `createdAt` / `updatedAt` | Timestamp | Server timestamps |

---

## Storage Structure

```
gallery/
  {galleryItemId}/
    original.webp
```

Never use user-provided filenames. Document ID is generated before upload.

---

## Security

### Firestore (`galleryItems`)

- **Admin read/list:** Unrestricted (`admin` and `super_admin` roles)
- **Public read/list:** Published items only; queries must include `where('isPublished', '==', true)`
- **Write:** Admin roles only (`users/{uid}.role` in `admin`, `super_admin`)

Admin collection queries use separate `allow read: if isAdmin()` so unfiltered
list operations succeed. A single OR rule (`isPublished || isAdmin`) causes
Firestore to reject unfiltered admin list queries.

### Storage (`gallery/{itemId}/...`)

- **Read:** Admin always; public only when linked Firestore doc has `isPublished == true`
- **Write/delete:** Admin only; max 5 MB; JPEG/PNG/WebP only

---

## Firebase Setup

1. Enable **Firebase Storage** in the Firebase Console (if not already enabled).
2. Deploy rules and indexes:

```bash
firebase deploy --only firestore:rules,firestore:indexes,storage
```

3. Ensure `.env` includes `VITE_FIREBASE_STORAGE_BUCKET`.

---

## Upload Limits

| Constraint | Value |
|---|---|
| Max size | 5 MB |
| Formats | JPEG, PNG, WebP |
| Output | WebP (client-side compression, max 2000px edge) |

---

## Composite Index

Required for public query:

- `isPublished` ASC + `displayOrder` ASC

Defined in `firestore.indexes.json`.

---

## Future Enhancements

- Cloud Function thumbnail generation (`thumb.webp`)
- Dedicated `/gallery` page with pagination
- Drag-and-drop display order in admin UI
- Lightbox on public site
