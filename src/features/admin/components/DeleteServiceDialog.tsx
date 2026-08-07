import { useState, useEffect } from 'react'
import Dialog from './Dialog'
import Button from '../../../components/ui/Button'
import type { Service } from '../../booking/types'

interface DeleteServiceDialogProps {
  /** The service to be deleted, or null when the dialog is closed. */
  service: Service | null
  /** Called when the user confirms deletion. */
  onConfirm: (serviceId: string) => Promise<void>
  /** Called to close the dialog. */
  onClose: () => void
  /** True while the delete mutation is in flight. */
  mutating: boolean
  /** The number of bookings referencing this service (fetched on open). */
  usageCount: number | null
  /** True while the usage count is being fetched. */
  checkingUsage: boolean
}

/**
 * Confirmation dialog for deleting a service.
 *
 * If the service has historical bookings, delete is disabled and a clear
 * explanation is shown (archive should be used instead). When no bookings
 * reference the service, the admin can proceed with hard deletion.
 *
 * Accessible via the Dialog component (focus trap, Escape, overlay click).
 */
export default function DeleteServiceDialog({
  service,
  onConfirm,
  onClose,
  mutating,
  usageCount,
  checkingUsage,
}: DeleteServiceDialogProps) {
  const [confirmText, setConfirmText] = useState('')
  const open = service !== null
  const serviceName = service?.name ?? ''

  // Reset confirmation text when the dialog opens for a different service.
  useEffect(() => {
    if (open) setConfirmText('')
  }, [open])

  const canDelete = usageCount === 0 && confirmText === serviceName

  return (
    <Dialog
      title="Delete Service"
      description={
        usageCount !== null && usageCount > 0
          ? `This service is referenced by ${usageCount} booking(s).`
          : 'Permanently remove this service from the system.'
      }
      open={open}
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={mutating}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={() => {
              if (service && canDelete) void onConfirm(service.serviceId)
            }}
            disabled={!canDelete || mutating}
          >
            {mutating ? 'Deleting...' : 'Delete Service'}
          </Button>
        </>
      }
    >
      {checkingUsage ? (
        <p className="text-sm text-gray-500">Checking booking references...</p>
      ) : usageCount === -1 ? (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          <p className="font-medium">Unable to check booking references</p>
          <p className="mt-1">
            The service could not be verified against existing bookings. Please try again. As a
            safety precaution, deletion is disabled until the check succeeds.
          </p>
        </div>
      ) : usageCount !== null && usageCount > 0 ? (
        <div className="space-y-3">
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
            <p className="font-medium">Cannot delete this service</p>
            <p className="mt-1">
              {usageCount} existing booking(s) reference &ldquo;{serviceName}&rdquo;.
              Deleting it would orphan historical booking records.
            </p>
            <p className="mt-2">
              <strong>Recommendation:</strong> Archive the service instead. Archived services are
              hidden from the booking wizard but continue to preserve booking history.
            </p>
          </div>
          <p className="text-sm text-gray-500">
            To proceed with deletion, you must first archive the service or remove all
            associated booking records.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-gray-700">
            Are you sure you want to permanently delete{' '}
            <strong className="text-gray-900">&ldquo;{serviceName}&rdquo;</strong>?
          </p>
          <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">
            <p className="font-medium">This action cannot be undone.</p>
            <p className="mt-1">
              The service will be removed from the system entirely. No customers will be able to
              book it, and this action cannot be reversed.
            </p>
          </div>
          <div>
            <label
              htmlFor="confirm-delete"
              className="block text-sm font-medium text-gray-700 mb-1.5"
            >
              Type <strong className="text-gray-900">{serviceName}</strong> to confirm:
            </label>
            <input
              id="confirm-delete"
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={serviceName}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent"
              autoComplete="off"
            />
          </div>
        </div>
      )}
    </Dialog>
  )
}
