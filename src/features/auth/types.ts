// ─── Admin user types ───────────────────────────────────────────────────────

/**
 * The salon's admin role. Only users with role === 'admin' may access the
 * admin dashboard and mutate bookings/services/settings/holidays.
 */
export type UserRole = 'admin' | 'customer'

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
