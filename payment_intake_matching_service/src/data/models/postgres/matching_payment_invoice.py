from sqlalchemy import Column, Integer, String, Numeric, DateTime, ForeignKey, func
from src.data.clients.postgres_client import base


class MatchingPaymentInvoice(base):
    __tablename__ = "matching_payment_invoice"

    id                = Column(Integer, primary_key=True, autoincrement=True, nullable=False)
    payment_detail_id = Column(Integer, ForeignKey("payment_details.id"), nullable=False)
    invoice_id        = Column(Integer, ForeignKey("invoice_data.id"), nullable=False)
    matched_amount    = Column(Numeric(12, 2), nullable=False)
    amount_pending    = Column(Numeric(12, 2), nullable=True)   # invoice_total - matched_amount
    match_score       = Column(Numeric(5, 2), nullable=False)   # confidence 0-100
    match_status      = Column(String(50), nullable=False)      # FULL / PARTIAL / FAILED
    created_at        = Column(DateTime(timezone=True), default=func.now())