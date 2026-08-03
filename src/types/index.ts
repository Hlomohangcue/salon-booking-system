// Core domain types — extended as features are implemented

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed'

export interface Service {
  id: string
  name: string
  description: string
  durationMinutes: number
  price: number
}

export interface Staff {
  id: string
  name: string
  specialties: string[]
}

export interface Booking {
  id: string
  customerId: string
  serviceId: string
  staffId: string
  dateTime: Date
  status: BookingStatus
  notes?: string
}

export interface User {
  id: string
  email: string
  displayName: string
  role: 'customer' | 'admin'
}
