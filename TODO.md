# Recovery — Restore Phase 3.7 verified state

## Context
A `git checkout HEAD -- .` recovery reverted several tracked files to the
Phase 3.3 commit, losing the Phase 3.4–3.7 additions those files carried. The
untracked Phase 3.4–3.7 modules (Customers, Reports, Settings) depend on those
additions, so the project no longer compiles. This task restores only the
tracked integration points that were reverted — no new functionality.

## Steps
- [x] 0. Analyse lost changes + plan approved (reconstruct 4 tracked files)
- [x] 1. Create safety branch `recovery-phase37`
- [x] 2. Restore `src/features/booking/types.ts` (completedAt, Customer/CustomerDocument, FIRESTORE_COLLECTIONS.CUSTOMERS, 3 optional BookingConfig fields)
- [x] 3. Restore `src/features/booking/utils/slotGenerator.ts` (Phase 3.7 enforcement points)
- [x] 4. Restore `src/features/booking/services/bookingService.ts` (completedAt in fromFirestore)
- [x] 5. Restore `src/features/admin/services/adminBookingService.ts` (completedAt in fromFirestore + completeBooking)
- [x] 6. Verify: `npx tsc -b`, `npx oxlint src`, `npm run build` (all pass)
</content>
