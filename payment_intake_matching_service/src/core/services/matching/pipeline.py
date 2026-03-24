from decimal import Decimal

from .strategies import (
    BaseMatchStrategy,
    InvoiceNumberStrategy,
    CustomerStrategy,
    CurrencyStrategy,
    AmountStrategy,
    ClosesBalanceStrategy,
)

DEFAULT_PIPELINE: list[BaseMatchStrategy] = [
    InvoiceNumberStrategy(),
    CustomerStrategy(),
    CurrencyStrategy(),
    AmountStrategy(),
    ClosesBalanceStrategy(),
]


def run_scoring_pipeline(
    payment,
    invoice,
    invoice_nos:         list[str],
    remaining_pay:       Decimal,
    inv_remaining:       Decimal,
    converted:           bool           = False,
    fx_rate:             Decimal | None = None,
    original_pay_amount: Decimal | None = None,
    customer_name:       str | None     = None,
    customer_email:      str | None     = None,
    pipeline:            list[BaseMatchStrategy] | None = None,
) -> tuple[int, list[str]]:

    active_pipeline = pipeline or DEFAULT_PIPELINE
    total_score     = 0
    all_reasons: list[str] = []

    for strategy in active_pipeline:
        result = strategy.score(
            payment=payment,
            invoice=invoice,
            invoice_nos=invoice_nos,
            remaining_pay=remaining_pay,
            inv_remaining=inv_remaining,
            converted=converted,
            fx_rate=fx_rate,
            original_pay_amount=original_pay_amount,
            customer_name=customer_name,    
            customer_email=customer_email,  
        )
        total_score  += result.points
        all_reasons  += result.reasons

        if not result.passed:
            return 0, all_reasons

    return min(total_score, 100), all_reasons