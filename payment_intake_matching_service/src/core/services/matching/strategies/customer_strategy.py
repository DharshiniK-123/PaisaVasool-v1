from decimal import Decimal

from src.config.matching_config import MATCHING_CONFIG
from .base import BaseMatchStrategy, ScoreResult


class CustomerStrategy(BaseMatchStrategy):

    def score(
        self,
        payment,
        invoice,
        invoice_nos:   list[str],
        remaining_pay: Decimal,
        inv_remaining: Decimal,
        customer_name:  str | None = None,
        customer_email: str | None = None,
        **kwargs,
    ) -> ScoreResult:

        if payment.customer_id == invoice.customer_id:
            label = self._label(customer_name, customer_email)
            return ScoreResult(
                points=MATCHING_CONFIG.w_customer,
                reasons=[f"Customer details match: {label}."],
                passed=True,
            )

        pay_label = self._label(customer_name, customer_email)
        return ScoreResult(
            points=0,
            reasons=[
                f"Customer details mismatch — payment is from {pay_label} "
                f"but invoice '{invoice.invoice_number}' belongs to a different customer."
            ],
            passed=True,  
        )

    @staticmethod
    def _label(name: str | None, email: str | None) -> str:

        name  = (name  or "").strip()
        email = (email or "").strip()

        if name and email:
            return f"{name} ({email})"
        if email:
            return email
        if name:
            return name
        return "Unknown Customer"