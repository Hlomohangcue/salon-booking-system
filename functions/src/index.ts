import { initializeApp } from 'firebase-admin/app'

initializeApp()

export { onBookingUpdated } from './triggers/onBookingUpdated'
export { resendNotificationCallable } from './callables/resendNotification'
