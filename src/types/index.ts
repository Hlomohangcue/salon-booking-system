// Core domain types
// Booking-specific types (Booking, Service, BookingStatus, etc.) have moved to:
//   src/features/booking/types.ts

export interface Staff {
  id: string
  name: string
  specialties: string[]
}

export interface User {
  id: string
  email: string
  displayName: string
  role: 'customer' | 'admin'
}
