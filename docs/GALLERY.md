# Gallery Management (Our Work) — Phase 4.6

Salon administrators upload portfolio photos via **Admin → Gallery**. Published items appear automatically on the homepage **Our Work** section.

---

## Architecture

```
Admin Gallery Page
  → useAdminGallery hook
  → adminGalleryService (Firestore + ImageStorageService)
  → CloudinaryImageStorageProvider (unsigned upload preset)
  → Cloudinary CDN → imageUrl

HomePage Our Work
  → usePublishedGallery hook
  → galleryService.getPublishedGalleryItems()
  → Firestore query (isPublished == true)
  → GalleryGrid renders imageUrl
```

Gallery images are hosted on **Cloudinary** (client-owned account). Firebase Storage is **not** used — the project can remain on the Firebase Spark plan for Firestore/Auth/Hosting.

Cloud Functions are **not** required for gallery uploads. Client-side Canvas compression produces WebP before upload.

---

## Firestore Schema

**Collection:** `galleryItems/{galleryItemId}`

| Field | Type | Notes |
|---|---|---|
| `galleryItemId` | string | Same as document ID |
| `title` | string | Required; used for alt text |
| `description` | string | Optional caption |
| `category` | string | `hair` \| `beard` \| `makeup` \| `treatment` \| `other` |
| `imageUrl` | string | Cloudinary HTTPS CDN URL |
| `provider` | string | `cloudinary` |
| `providerKey` | string | Cloudinary `public_id`, e.g. `makeng-gallery/{id}` |
| `storagePath` | string? | Legacy alias of `providerKey` |
| `isPublished` | boolean | Controls public visibility |
| `displayOrder` | number | Lower = first |
| `uploadedBy` | string | Admin Auth UID |
| `isFeatured` | boolean | Shown first on public grid |
| `featuredUntil` | Timestamp? | Optional featured end date |
| `mimeType` | string? | Usually `image/webp` |
| `fileSizeBytes` | number? | Post-compression size |
| `createdAt` / `updatedAt` | Timestamp | Server timestamps |

---

## Cloudinary Setup (client-owned account)

1. Client creates a free [Cloudinary account](https://cloudinary.com/users/register_free) (no credit card required).
2. Create an **unsigned upload preset** with:
   - Folder or `public_id` prefix: `makeng-gallery`
   - Max file size: 5 MB
   - Allowed formats: JPG, PNG, WebP
3. Add to `.env`:

```env
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=your_unsigned_preset_name
```

**Never** expose `CLOUDINARY_API_SECRET` in frontend code or `VITE_*` environment variables. The API secret is server-only and is not used in the Gallery MVP.

---

## Cloudinary Unsigned Upload Preset — Security Checklist

The client must create a **dedicated unsigned upload preset** for the Makeng Salon gallery only.

| Setting | Recommended value |
|---|---|
| Preset purpose | Makeng Salon Gallery only |
| Folder / `public_id` prefix | `makeng-gallery` |
| Allowed resource type | **image** only |
| Allowed formats | `jpg`, `jpeg`, `png`, `webp` |
| Maximum upload size | **5 MB** |
| Transformations | Do **not** allow arbitrary unsigned transformations |
| Unsigned parameters | Restrict to the minimum required for gallery uploads |

### What protects what

**Firebase Auth + Firestore rules** protect the application's gallery **metadata** (`galleryItems`). Only authenticated admins can create, update, or delete gallery documents.

**Cloudinary's unsigned upload preset** protects the Cloudinary **upload endpoint**. The preset must be tightly restricted because unsigned presets **cannot identify Firebase admins**. Anyone who discovers the cloud name + preset name could attempt direct uploads within the preset's limits.

The unsigned preset does **not** provide Firebase-admin-level authorization. It is a provider-side upload gate, not an application auth gate.

### Domain model note

- `provider` — image provider name (currently `cloudinary`)
- `providerKey` — provider asset identifier (Cloudinary `public_id`)
- `storagePath` — **deprecated** legacy alias of `providerKey`, kept for backward compatibility with older documents

---

## MVP Limitations

1. **Orphan assets:** If a Cloudinary upload succeeds but the Firestore write fails, the remote image may remain in Cloudinary with no gallery document. Remote cleanup is not available in the MVP (no API secret in frontend).
2. **Remote delete:** Deleting a gallery item removes the Firestore document only. The Cloudinary asset may remain until manually cleaned up or a future server-side delete is implemented.
3. **Direct URLs:** Unpublished or deleted gallery items may still be accessible via a previously known Cloudinary CDN URL.

---

## Security

### Firestore (`galleryItems`)

- **Admin read/list:** Unrestricted (`admin` and `super_admin` roles)
- **Public read/list:** Published items only; queries must include `where('isPublished', '==', true)`
- **Write:** Admin roles only

### Cloudinary

- Upload: unsigned preset with strict limits configured in Cloudinary console
- Delete: MVP removes Firestore doc only; remote delete requires API secret (future Cloud Function)

---

## Deploy

```bash
firebase deploy --only firestore:rules,firestore:indexes,hosting
```

---

## Upload Limits

| Constraint | Value |
|---|---|
| Max size | 5 MB |
| Formats | JPEG, PNG, WebP |
| Output | WebP (client-side compression, max 2000px edge) |
| Provider key | `makeng-gallery/{galleryItemId}` |

---

## Composite Index

Required for public query:

- `isPublished` ASC + `displayOrder` ASC

Defined in `firestore.indexes.json`.

---

## Future Enhancements

- Cloud Function for Cloudinary Admin API delete (when Blaze plan enabled)
- Dedicated `/gallery` page with pagination
- Drag-and-drop display order in admin UI
- Lightbox on public site
