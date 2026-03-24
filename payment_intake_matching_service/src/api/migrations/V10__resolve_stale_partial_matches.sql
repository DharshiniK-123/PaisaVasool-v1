-- V10: Auto-resolve all discrepancy types that can be determined as resolved
-- from existing data state, retroactively fixing records created before the
-- auto-resolve logic was introduced.

-- 1. PARTIAL → RESOLVED: invoice is now PAID or OVERPAID
UPDATE matching_payment_invoice AS mpi
SET
    match_status = 'RESOLVED',
    match_reason = COALESCE(match_reason, '') ||
        ' This partial payment has since been completed — invoice is now fully paid.'
WHERE
    mpi.match_status = 'PARTIAL'
    AND mpi.invoice_id IN (
        SELECT id FROM invoice_data
        WHERE payment_status IN ('PAID', 'OVERPAID')
        AND is_deleted = FALSE
    );

-- 2. FAILED → RESOLVED: the payment itself has been deleted/voided
UPDATE matching_payment_invoice AS mpi
SET
    match_status = 'RESOLVED',
    match_reason = COALESCE(match_reason, '') ||
        ' Payment was deleted/voided — discrepancy is no longer applicable.'
WHERE
    mpi.match_status = 'FAILED'
    AND mpi.payment_detail_id IN (
        SELECT id FROM payment_details
        WHERE is_deleted = TRUE
    );

-- 3. OVERPAYMENT → RESOLVED: the invoice has been deleted/voided
UPDATE matching_payment_invoice AS mpi
SET
    match_status = 'RESOLVED',
    match_reason = COALESCE(match_reason, '') ||
        ' Invoice has been voided — overpayment discrepancy is no longer applicable.'
WHERE
    mpi.match_status = 'OVERPAYMENT'
    AND mpi.invoice_id IN (
        SELECT id FROM invoice_data
        WHERE is_deleted = TRUE
    );

-- 4. DUPLICATE → RESOLVED: the conflicting payment has been deleted
-- A DUPLICATE is resolved when every other DUPLICATE for the same invoice
-- belongs to a deleted payment (only one live payment remains).
UPDATE matching_payment_invoice AS mpi
SET
    match_status = 'RESOLVED',
    match_reason = COALESCE(match_reason, '') ||
        ' The duplicate payment entry has been removed — this record is no longer a duplicate.'
WHERE
    mpi.match_status = 'DUPLICATE'
    AND NOT EXISTS (
        SELECT 1
        FROM matching_payment_invoice other
        JOIN payment_details pd ON pd.id = other.payment_detail_id
        WHERE other.invoice_id       = mpi.invoice_id
          AND other.match_status     = 'DUPLICATE'
          AND other.payment_detail_id != mpi.payment_detail_id
          AND pd.is_deleted = FALSE
    )
    AND EXISTS (
        SELECT 1
        FROM matching_payment_invoice other2
        WHERE other2.invoice_id        = mpi.invoice_id
          AND other2.match_status      = 'DUPLICATE'
          AND other2.payment_detail_id != mpi.payment_detail_id
    );

-- 5. INVALIDATED: retroactively mark successful matches on deleted invoices
-- so their payments become eligible for re-matching.
UPDATE matching_payment_invoice AS mpi
SET
    match_status = 'INVALIDATED',
    match_reason = COALESCE(match_reason, '') ||
        ' Invoice was deleted — this match has been invalidated.'
        ' Payment will be re-matched when a replacement invoice is uploaded.'
WHERE
    mpi.match_status IN ('FULL', 'PARTIAL', 'OVERPAYMENT')
    AND mpi.invoice_id IN (
        SELECT id FROM invoice_data
        WHERE is_deleted = TRUE
    );
