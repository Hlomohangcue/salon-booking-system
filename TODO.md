# Phase 3.2 — Booking Management

## Steps
- [x] 0. Plan approved (admin service keeps booking management out of customer-facing bookingService)
- [x] 1. Create `src/features/admin/services/adminBookingService.ts` (explicit methods: getAllBookings, getBookingsByDate, confirmBooking, cancelBooking, completeBooking, markNoShow)
- [x] 2. Create `src/features/admin/hooks/useAdminBookings.ts`
- [x] 3. Create `src/features/admin/hooks/useAdminDashboard.ts`
- [x] 4. Create `src/features/admin/components/BookingDetailPanel.tsx`
- [x] 5. Rewrite `src/features/admin/pages/AdminBookingsPage.tsx` (search, date filter, status filter, sorting, states, detail)
- [x] 6. Rewrite `src/features/admin/pages/AdminDashboardPage.tsx` (live stats, recent bookings, upcoming today)
- [x] 7. Remove unused customer-facing `cancelBooking` stub from `bookingService.ts`
- [x] 8. Verify: `tsc -b`, `oxlint src`, `npm run build`
