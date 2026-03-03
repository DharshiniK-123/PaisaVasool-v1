import asyncio

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from src.api.rest.dependencies import get_current_user, get_db
from src.data.models.postgres.matching_payment_invoice import MatchingPaymentInvoice
from src.data.models.postgres.payment_detail import PaymentDetail
from src.data.models.postgres.invoice_data import InvoiceData
from src.schemas.payment_intake_matching import MatchingResponse

router = APIRouter(prefix="/matching", tags=["Matching"])




@router.get("/payment/{payment_id}", response_model=list[MatchingResponse])
async def get_matches_by_payment(payment_id: int, db: AsyncSession = Depends(get_db),user: dict = Depends(get_current_user)):
    result = await db.execute(select(MatchingPaymentInvoice).where(MatchingPaymentInvoice.payment_detail_id == payment_id).order_by(MatchingPaymentInvoice.created_at.desc()))
    return result.scalars().all()


@router.get("/invoice/{invoice_id}", response_model=list[MatchingResponse])
async def get_matches_by_invoice(invoice_id: int, db: AsyncSession = Depends(get_db),user:dict=Depends(get_current_user)):
    result = await db.execute(select(MatchingPaymentInvoice).where(MatchingPaymentInvoice.invoice_id == invoice_id).order_by(MatchingPaymentInvoice.created_at.desc()))
    return result.scalars().all()


@router.get("/dashboard/summary")
async def get_dashboard_summary(db: AsyncSession = Depends(get_db),user:dict=Depends(get_current_user)):
    result = await db.execute(select(MatchingPaymentInvoice).order_by(MatchingPaymentInvoice.created_at.desc()))
    all_matches = result.scalars().all()
    return {
        "FULL":        [m for m in all_matches if m.match_status == "FULL"],
        "PARTIAL":     [m for m in all_matches if m.match_status == "PARTIAL"],
        "OVERPAYMENT": [m for m in all_matches if m.match_status == "OVERPAYMENT"],
        "DUPLICATE":   [m for m in all_matches if m.match_status == "DUPLICATE"],
        "FAILED":      [m for m in all_matches if m.match_status == "FAILED"],
    }




@router.get("/dashboard/unmatched-payments")
async def get_unmatched_payments(db: AsyncSession = Depends(get_db),user:dict=Depends(get_current_user)):
    matched_payment_ids = (select(MatchingPaymentInvoice.payment_detail_id).where(MatchingPaymentInvoice.match_status.in_(["FULL", "PARTIAL", "OVERPAYMENT"])))
    result = await db.execute(select(PaymentDetail).where(PaymentDetail.id.notin_(matched_payment_ids)))
    return result.scalars().all()


@router.get("/dashboard/unmatched-invoices")
async def get_unmatched_invoices(db: AsyncSession = Depends(get_db),user:dict=Depends(get_current_user)):
    result = await db.execute(select(InvoiceData).where(InvoiceData.payment_status == "UNPAID"))
    return result.scalars().all()


@router.get("/dashboard/recent", response_model=list[MatchingResponse])
async def get_recent_matches(limit: int = 20, db: AsyncSession = Depends(get_db),user:dict=Depends(get_current_user)):
    result = await db.execute(select(MatchingPaymentInvoice).order_by(MatchingPaymentInvoice.created_at.desc()).limit(limit))
    return result.scalars().all()