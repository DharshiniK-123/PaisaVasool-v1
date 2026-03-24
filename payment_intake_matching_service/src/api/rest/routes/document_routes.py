import json
import logging
import uuid
from collections import defaultdict
from typing import Literal, List
from fastapi import APIRouter, HTTPException, UploadFile, File, Depends, Query
from pydantic import BaseModel
from sqlalchemy import select, func as sqlfunc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError
from src.data.models.postgres.customer import Customer
from src.api.rest.dependencies import get_db, get_current_user
from src.core.services.document import upload_document_and_enqueue, save_document_records
from src.data.models.postgres.document import Document
from src.data.models.postgres.invoice_data import InvoiceData
from src.data.models.postgres.payment_detail import PaymentDetail
from src.data.models.postgres.matching_payment_invoice import MatchingPaymentInvoice
from src.data.repositories.generic_repository import get_instance_by_id, bulk_get_instance
from src.data.clients.redis_clients import redis_client
from src.core.services.matching.db_writer import (
    resolve_duplicate_records,
    resolve_failed_records_for_payment,
    resolve_overpayment_records,
    invalidate_match_records_for_invoice,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/documents", tags=["Documents"])

MAX_FILE_SIZE = 10 * 1024 * 1024


def _is_empty(value) -> bool:
    if value is None:
        return True
    if isinstance(value, str) and value.strip() == "":
        return True
    return False


def _fmt_customer(name: str | None, email: str | None) -> str:
    name  = (name  or "").strip()
    email = (email or "").strip()
    if name and email:
        return f"{name} ({email})"
    return email or name or "Unknown Customer"


def _validate_paid_date(records: list) -> None:
    errors = []
    for idx, record in enumerate(records, start=1):
        if _is_empty(record.get("paid_date")):
            errors.append(f"Record {idx}: missing — paid_date")
    if errors:
        raise HTTPException(
            status_code=422,
            detail={
                "message": "Validation failed. Payment date is required.",
                "errors": errors,
            },
        )


@router.post("/upload")
async def upload_document(
    document_type: Literal["INVOICE", "PAYMENT"] = Query(...),
    file:          UploadFile                    = File(...),
    db:            AsyncSession                  = Depends(get_db),
    user:          dict                          = Depends(get_current_user),
):
    try:
        contents = await file.read()

        if len(contents) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=413,
                detail="File too large. Maximum allowed size is 10MB.",
            )

        await file.seek(0)

        job_id = str(uuid.uuid4())

        result = await upload_document_and_enqueue(
            file=file,
            document_type=document_type,
            db=db,
            job_id=job_id,
            user_id=user.get("id"),
        )

        return {
            "file_name":   file.filename,
            "status":      "PROCESSING",
            "job_id":      job_id,
            "document_id": result["document_id"],
            "message":     "File uploaded. Extraction running in background.",
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error("upload_failed", extra={"error": str(e)}, exc_info=True)
        raise HTTPException(status_code=500, detail="File upload unsuccessful.")


@router.get("/jobs/{job_id}/status")
async def get_job_status(
    job_id: str,
    user:   dict = Depends(get_current_user),
):
    try:
        data = redis_client.get(f"job:{job_id}")
        if not data:
            return {
                "job_id":  job_id,
                "status":  "PROCESSING",
                "message": "Document is being processed. Please check back shortly.",
            }
        return {"job_id": job_id, **json.loads(data)}
    except Exception as e:
        logger.error("job_status_failed", extra={"job_id": job_id, "error": str(e)})
        raise HTTPException(status_code=500, detail="Could not fetch job status.")


@router.get("/stats")
async def get_user_stats(
    db:   AsyncSession = Depends(get_db),
    user: dict         = Depends(get_current_user),
):
    try:
        invoice_q = await db.execute(
            select(
                Document.user_id,
                sqlfunc.count(InvoiceData.id).label("invoices_uploaded"),
            )
            .join(InvoiceData, InvoiceData.document_id == Document.id)
            .where(
                Document.document_type == "INVOICE",
                Document.user_id.isnot(None),
                InvoiceData.is_deleted.is_(False),
            )
            .group_by(Document.user_id)
        )
        invoice_counts: dict[int, int] = {
            row.user_id: row.invoices_uploaded for row in invoice_q.all()
        }

        payment_q = await db.execute(
            select(
                Document.user_id,
                sqlfunc.count(PaymentDetail.id).label("payments_uploaded"),
            )
            .join(PaymentDetail, PaymentDetail.document_id == Document.id)
            .where(
                Document.document_type == "PAYMENT",
                Document.user_id.isnot(None),
                PaymentDetail.is_deleted.is_(False),
            )
            .group_by(Document.user_id)
        )
        payment_counts: dict[int, int] = {
            row.user_id: row.payments_uploaded for row in payment_q.all()
        }

        match_q = await db.execute(
            select(
                Document.user_id,
                sqlfunc.count(MatchingPaymentInvoice.id).label("matches_made"),
            )
            .join(PaymentDetail, PaymentDetail.document_id == Document.id)
            .join(
                MatchingPaymentInvoice,
                MatchingPaymentInvoice.payment_detail_id == PaymentDetail.id,
            )
            .where(
                Document.document_type == "PAYMENT",
                Document.user_id.isnot(None),
                PaymentDetail.is_deleted.is_(False),
                MatchingPaymentInvoice.match_status.notin_(["FAILED"]),
            )
            .group_by(Document.user_id)
        )
        match_counts: dict[int, int] = {
            row.user_id: row.matches_made for row in match_q.all()
        }

        last_active_q = await db.execute(
            select(
                Document.user_id,
                sqlfunc.max(Document.uploaded_at).label("last_active"),
            )
            .where(Document.user_id.isnot(None))
            .group_by(Document.user_id)
        )
        last_active: dict[int, str] = {
            row.user_id: row.last_active.isoformat() if row.last_active else None
            for row in last_active_q.all()
        }

        all_user_ids = (
            set(invoice_counts)
            | set(payment_counts)
            | set(match_counts)
            | set(last_active)
        )

        return [
            {
                "user_id":           uid,
                "invoices_uploaded": invoice_counts.get(uid, 0),
                "payments_uploaded": payment_counts.get(uid, 0),
                "matches_made":      match_counts.get(uid, 0),
                "last_active":       last_active.get(uid),
            }
            for uid in sorted(all_user_ids)
        ]

    except HTTPException:
        raise
    except Exception as e:
        logger.error("stats_failed", extra={"error": str(e)}, exc_info=True)
        raise HTTPException(status_code=500, detail="Could not fetch user stats.")


class SaveRecordsRequest(BaseModel):
    document_type: Literal["INVOICE", "PAYMENT"]
    records:       List[dict]


@router.post("/{document_id}/save")
async def save_records(
    document_id: int,
    body:        SaveRecordsRequest,
    db:          AsyncSession = Depends(get_db),
    user:        dict         = Depends(get_current_user),
):
    try:
        doc = await get_instance_by_id(document_id, Document, db)
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found.")

        if not body.records:
            raise HTTPException(status_code=400, detail="No records provided.")

        for idx, record in enumerate(body.records, start=1):
            if not record.get("customer_id"):
                customer_name  = (record.get("customer_name")  or "").strip()
                customer_email = (record.get("customer_email") or "").strip()

                if not customer_name and not customer_email:
                    raise HTTPException(
                        status_code=422,
                        detail={
                            "message": "Validation failed. Customer details are missing.",
                            "errors": [
                                f"Record {idx}: no customer name or email provided. "
                                "At least one is required to identify the customer."
                            ],
                        },
                    )

                customer = None

                if customer_email:
                    result = await db.execute(
                        select(Customer).where(
                            sqlfunc.lower(Customer.email) == customer_email.lower()
                        )
                    )
                    customer = result.scalar_one_or_none()

                if not customer and customer_name:
                    result = await db.execute(
                        select(Customer).where(
                            sqlfunc.lower(Customer.name) == customer_name.lower()
                        )
                    )
                    customer = result.scalar_one_or_none()

                if not customer:
                    identifier = _fmt_customer(customer_name, customer_email)

                    if body.document_type == "PAYMENT":
                        raise HTTPException(
                            status_code=422,
                            detail={
                                "message": "Validation failed. Customer not found.",
                                "errors": [
                                    f"Record {idx}: customer '{identifier}' does not exist. "
                                    "Payments can only be applied to existing customers."
                                ],
                            },
                        )

                    if not customer_email:
                        raise HTTPException(
                            status_code=422,
                            detail={
                                "message": "Validation failed. Cannot create customer.",
                                "errors": [
                                    f"Record {idx}: no email provided — "
                                    f"cannot auto-create customer '{customer_name}'. "
                                    "Email is required to create a new customer."
                                ],
                            },
                        )

                    customer = Customer(
                        name=customer_name or customer_email,
                        email=customer_email,
                        phone=record.get("customer_phone") or None,
                    )
                    db.add(customer)
                    await db.flush()  

                record["customer_id"] = int(customer.id)

        if body.document_type == "PAYMENT":
            _validate_paid_date(body.records)

        await db.commit()

        count = await save_document_records(
            document_id=document_id,
            document_type=body.document_type,
            records=body.records,  
        )

        return {
            "document_id":   document_id,
            "status":        "PARSED",
            "records_saved": count,
            "message":       "Records saved successfully.",
        }

    except HTTPException:
        raise
    except IntegrityError as e:
        raise HTTPException(
            status_code=409,
            detail="Duplicate record detected",
        )
    except Exception as e:
        logger.error("save_records_failed", extra={"document_id": document_id, "error": str(e)}, exc_info=True)
        raise HTTPException(status_code=500, detail="Save data failed.")


@router.get("/")
async def list_documents(
    db:   AsyncSession = Depends(get_db),
    user: dict         = Depends(get_current_user),
):
    try:
        return await bulk_get_instance(Document, db)
    except Exception as e:
        logger.error("list_documents_failed", extra={"error": str(e)})
        raise HTTPException(status_code=500, detail="Could not fetch documents.")


@router.get("/{document_id}")
async def get_document(
    document_id: int,
    db:          AsyncSession = Depends(get_db),
    user:        dict         = Depends(get_current_user),
):
    try:
        doc = await get_instance_by_id(document_id, Document, db)
        if not doc:
            raise HTTPException(status_code=404, detail="Document not found.")
        return doc
    except HTTPException:
        raise
    except Exception as e:
        logger.error("get_document_failed", extra={"document_id": document_id, "error": str(e)})
        raise HTTPException(status_code=500, detail="Could not fetch document.")



@router.get("/{document_id}/invoices")
async def get_document_invoices(
    document_id: int,
    db:          AsyncSession = Depends(get_db),
    user:        dict         = Depends(get_current_user),
):
    try:
        result = await db.execute(
            select(
                InvoiceData,
                Customer.name.label("customer_name"),
                Customer.email.label("customer_email"),
                MatchingPaymentInvoice.id.label("match_id"),
                MatchingPaymentInvoice.match_status,
                MatchingPaymentInvoice.matched_amount,
                MatchingPaymentInvoice.amount_pending,
                MatchingPaymentInvoice.match_reason,
                MatchingPaymentInvoice.payment_detail_id,
                MatchingPaymentInvoice.created_at.label("matched_at"),
            )
            .join(Customer, InvoiceData.customer_id == Customer.id, isouter=True)
            .outerjoin(
                MatchingPaymentInvoice,
                MatchingPaymentInvoice.invoice_id == InvoiceData.id,
            )
            .where(InvoiceData.document_id == document_id)
            .order_by(InvoiceData.id, MatchingPaymentInvoice.created_at.desc())
        )

        rows = result.all()
        if not rows:
            return []

        invoice_map: dict          = {}
        matches_map: defaultdict   = defaultdict(list)

        for row in rows:
            inv    = row.InvoiceData
            inv_id = inv.id

            if inv_id not in invoice_map:
                invoice_map[inv_id] = {
                    **{k: v for k, v in inv.__dict__.items() if not k.startswith("_")},
                    "customer_name":  row.customer_name,
                    "customer_email": row.customer_email,
                    "currency":       inv.currency or "INR",
                }

            if row.match_id is not None:
                matches_map[inv_id].append({
                    "match_id":          row.match_id,
                    "match_status":      row.match_status,
                    "matched_amount":    row.matched_amount,
                    "amount_pending":    row.amount_pending,
                    "match_reason":      row.match_reason,
                    "payment_detail_id": row.payment_detail_id,
                    "matched_at":        row.matched_at,
                })

        return [
            {**inv_data, "matches": matches_map.get(inv_id, [])}
            for inv_id, inv_data in invoice_map.items()
        ]

    except HTTPException:
        raise
    except Exception as e:
        logger.error("get_invoices_failed", extra={"document_id": document_id, "error": str(e)}, exc_info=True)
        raise HTTPException(status_code=500, detail="Could not fetch invoices.")



@router.get("/{document_id}/payments")
async def get_document_payments(
    document_id: int,
    db:          AsyncSession = Depends(get_db),
    user:        dict         = Depends(get_current_user),
):
    try:
        result = await db.execute(
            select(
                PaymentDetail.id,
                PaymentDetail.document_id,
                PaymentDetail.customer_id,
                PaymentDetail.invoice_no,
                PaymentDetail.payment_amount.label("amount"),
                PaymentDetail.currency,
                PaymentDetail.paid_date.label("payment_date"),
                PaymentDetail.payment_reference.label("reference_number"),
                Customer.name.label("payer_name"),
                Customer.email.label("payer_email"),
                Customer.phone.label("payer_phone"),
            )
            .join(Customer, PaymentDetail.customer_id == Customer.id, isouter=True)
            .where(
                PaymentDetail.document_id == document_id,
                PaymentDetail.is_deleted.is_(False),
            )
        )
        rows = result.mappings().all()
        if not rows:
            raise HTTPException(
                status_code=404,
                detail=f"No payments found for document {document_id}.",
            )
        return [dict(row) for row in rows]

    except HTTPException:
        raise
    except Exception as e:
        logger.error("get_payments_failed", extra={"document_id": document_id, "error": str(e)})
        raise HTTPException(status_code=500, detail="Could not fetch payments.")



@router.delete("/invoices/{invoice_id}")
async def delete_invoice(
    invoice_id: int,
    db:         AsyncSession = Depends(get_db),
    user:       dict         = Depends(get_current_user),
):
    try:
        result = await db.execute(
            select(InvoiceData).where(InvoiceData.id == invoice_id)
        )
        invoice = result.scalar_one_or_none()
        if not invoice:
            raise HTTPException(status_code=404, detail=f"Invoice {invoice_id} not found.")
        invoice.is_deleted = True
        # Invalidate all successful matches so linked payments can be re-matched
        # when the user uploads a replacement invoice.
        await invalidate_match_records_for_invoice(invoice_id, db)
        # Auto-resolve: overpayment discrepancies on a voided invoice are moot
        await resolve_overpayment_records(invoice_id, db)
        await db.commit()
        return {"message": f"Invoice {invoice_id} deleted successfully."}
    except HTTPException:
        raise
    except Exception as e:
        logger.error("delete_invoice_failed", extra={"invoice_id": invoice_id, "error": str(e)})
        raise HTTPException(status_code=500, detail="Could not delete invoice.")


@router.delete("/payments/{payment_id}")
async def delete_payment(
    payment_id: int,
    db:         AsyncSession = Depends(get_db),
    user:       dict         = Depends(get_current_user),
):
    try:
        result = await db.execute(
            select(PaymentDetail).where(PaymentDetail.id == payment_id)
        )
        payment = result.scalar_one_or_none()
        if not payment:
            raise HTTPException(status_code=404, detail=f"Payment {payment_id} not found.")
        payment.is_deleted = True
        # Auto-resolve: FAILED records for a deleted payment are no longer actionable
        await resolve_failed_records_for_payment(payment_id, db)
        # Auto-resolve: DUPLICATE records where the conflicting payment is now deleted
        await resolve_duplicate_records(payment_id, db)
        await db.commit()
        return {"message": f"Payment {payment_id} deleted successfully."}
    except HTTPException:
        raise
    except Exception as e:
        logger.error("delete_payment_failed", extra={"payment_id": payment_id, "error": str(e)})
        raise HTTPException(status_code=500, detail="Could not delete payment.")