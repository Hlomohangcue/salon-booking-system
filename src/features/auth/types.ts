// ─── Admin user types ───────────────────────────────────────────────────────

/**
 * Application roles stored on users/{uid}.
 * `admin` and `super_admin` may access the admin dashboard; `super_admin`
 * is reserved for elevated operations that may be added in future phases.
 */
export type UserRole = 'admin' | 'super_admin' | 'customer'

/**
 * The shape of the user document stored in the `users` collection.
 * The Firestore document ID is the user's Firebase Auth UID.
 */
export interface AdminUser {
  /** Firebase Auth UID — matches the Firestore document ID in `users/{uid}` */
  uid: string
  email: string
  displayName: string
  role: UserRole
}

/**
 * Raw shape of a user document as received from Firestore.
 * Timestamp fields are converted by the service layer.
 */
export interface AdminUserDocument {
  uid: string
  email: string
  displayName: string
  role: UserRole
}

// ─── Login form values ──────────────────────────────────────────────────────

export interface LoginFormValues {
  email: string
  password: string
}
