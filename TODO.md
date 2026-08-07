# Phase 3.3 — Services Management

## Steps
- [x] 0. Investigate existing service model + architecture (Service interface, services collection, availabilityService, seed shape, firestore rules)
- [x] 1. Create `src/features/admin/services/serviceValidation.ts` (Zod schema, ServiceFormValues, category options)
- [x] 2. Create `src/features/admin/services/adminServiceService.ts` (explicit methods: getServices, getService, createService, updateService, archiveService, restoreService, deleteService, getServiceUsage)
- [x] 3. Create `src/features/admin/hooks/useAdminServices.ts`
- [x] 4. Create `src/features/admin/components/Dialog.tsx` (accessible modal: focus trap, Escape, overlay click, aria)
- [x] 5. Create `src/features/admin/components/ServiceForm.tsx` (React Hook Form + Zod)
- [x] 6. Create `src/features/admin/components/ServiceTable.tsx`
- [x] 7. Create `src/features/admin/components/DeleteServiceDialog.tsx`
- [x] 8. Rewrite `src/features/admin/pages/AdminServicesPage.tsx` (search, category/status filters, states, create/edit/archive/restore/delete)
- [x] 9. Verify: `tsc -b`, `oxlint src`, `npm run build`
