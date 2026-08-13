/**
 * Detects the booking status transition that should trigger confirmation
 * notifications.
 *
 * Only `pending → confirmed` (or any non-confirmed → confirmed) fires.
 * Re-writes while already confirmed, or transitions away from confirmed, do not.
 */
export function isConfirmationTransition(
  beforeStatus: string | undefined,
  afterStatus: string | undefined,
): boolean {
  if (!beforeStatus || !afterStatus) return false
  return beforeStatus !== 'confirmed' && afterStatus === 'confirmed'
}
