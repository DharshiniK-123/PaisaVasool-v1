import json
import logging
import asyncio
import re
from typing import Optional, Union

from fastapi import HTTPException
from pydantic import BaseModel, Field, ValidationError
from langchain_core.messages import HumanMessage

from src.control.extraction.llm_client import get_llm, get_vision_llm
from src.control.extraction.prompts import INVOICE_EXTRACT_PROMPT, PAYMENT_EXTRACT_PROMPT

logger = logging.getLogger(__name__)

MAX_TEXT_CHARS   = 40_000
LLM_TIMEOUT_SECS = 120
MAX_RETRIES      = 2



class InvoiceExtraction(BaseModel):
    mismatch:       bool            = Field(description="true if this is NOT an invoice or critical data is unreadable, false if it is a valid invoice")
    detected_type:  Optional[str]   = Field(default=None, description="If mismatch=true: what the document actually is — PAYMENT or UNKNOWN. If mismatch=false: null")
    invoice_number: Optional[str]   = Field(default=None, description="Invoice ID or number. null if mismatch=true")
    invoice_date:   Optional[str]   = Field(default=None, description="Invoice date in YYYY-MM-DD. null if mismatch=true")
    due_date:       Optional[str]   = Field(default=None, description="Due date in YYYY-MM-DD. If absent use invoice_date + 30 days. null if mismatch=true")
    total_amount:   Optional[float] = Field(default=None, description="Final amount due as a number. null if mismatch=true")
    currency:       Optional[str]   = Field(default=None, description="3-letter code: INR, USD, EUR, GBP. null if mismatch=true")
    customer_name:  Optional[str]   = Field(default=None, description="Customer name or null")
    customer_email: Optional[str]   = Field(default=None, description="Customer email or null")
    gl_code:        Optional[str]   = Field(default=None, description="GL code or null")


class PaymentExtraction(BaseModel):
    mismatch:          bool            = Field(description="true if this is NOT a payment or critical data is unreadable, false if it is a valid payment")
    detected_type:     Optional[str]   = Field(default=None, description="If mismatch=true: what the document actually is — INVOICE or UNKNOWN. If mismatch=false: null")
    invoice_no:        Optional[str]   = Field(default=None, description="Invoice number(s) this payment is for. null if mismatch=true")
    payment_amount:    Optional[float] = Field(default=None, description="Amount paid as a number. null if mismatch=true")
    paid_date:         Optional[str]   = Field(default=None, description="Payment date in YYYY-MM-DD. null if mismatch=true")
    payment_reference: Optional[str]   = Field(default=None, description="UTR/bank reference or null")
    currency:          Optional[str]   = Field(default=None, description="3-letter code: INR, USD, EUR, GBP. null if mismatch=true")
    customer_name:     Optional[str]   = Field(default=None, description="Payer name or null")
    customer_email:    Optional[str]   = Field(default=None, description="Payer email or null")



class MultiInvoiceExtraction(BaseModel):
    records: list[InvoiceExtraction] = Field(
        description="List of all invoices found in the document. One element per invoice. "
                    "If the document is not an invoice, return a single element with mismatch=true."
    )

class MultiPaymentExtraction(BaseModel):
    records: list[PaymentExtraction] = Field(
        description="List of all payment records found in the document. One element per payment. "
                    "If the document is not a payment, return a single element with mismatch=true."
    )


def _get_prompt_and_schema(document_type: str):
    if document_type == "INVOICE":
        return INVOICE_EXTRACT_PROMPT, InvoiceExtraction, MultiInvoiceExtraction
    return PAYMENT_EXTRACT_PROMPT, PaymentExtraction, MultiPaymentExtraction



def _safe_json_parse(raw: str) -> Optional[dict]:
    cleaned = re.sub(r"^```(?:json)?\s*", "", raw.strip(), flags=re.MULTILINE)
    cleaned = re.sub(r"\s*```$", "", cleaned.strip(), flags=re.MULTILINE)
    try:
        return json.loads(cleaned.strip())
    except json.JSONDecodeError:
        return None


def _raise_mismatch(document_type: str, detected: str) -> None:
    raise HTTPException(
        status_code=422,
        detail=(
            f"Document mismatch: you selected '{document_type}' "
            f"but the file appears to be '{detected}'. "
            "Please re-upload the correct document."
        ),
    )


def _handle_llm_error(e: Exception, document_type: str) -> None:
    logger.error(
        "extraction_error",
        extra={
            "doc_type":   document_type,
            "error_type": type(e).__name__,
            "detail":     str(e),
        },
    )
    if isinstance(e, ValidationError):
        raise HTTPException(
            status_code=422,
            detail=f"The uploaded {document_type.lower()} is missing required fields or has invalid data.",
        )
    if isinstance(e, (json.JSONDecodeError, ValueError)):
        raise HTTPException(
            status_code=422,
            detail="The document could not be parsed. Please verify the file and try again.",
        )
    raise HTTPException(
        status_code=500,
        detail="Document processing failed. Please try again.",
    )


def _is_transient(e: Exception) -> bool:
    transient_phrases = ("rate limit", "timeout", "503", "502", "connection")
    return any(p in str(e).lower() for p in transient_phrases)


async def _invoke_with_retry(chain, input_value, retries: int = MAX_RETRIES):
    last_exc: Exception = RuntimeError("unreachable")
    for attempt in range(retries + 1):
        try:
            return await asyncio.wait_for(
                chain.ainvoke(input_value),
                timeout=LLM_TIMEOUT_SECS,
            )
        except asyncio.TimeoutError:
            last_exc = TimeoutError(f"LLM timed out after {LLM_TIMEOUT_SECS}s")
            logger.warning("llm_timeout", extra={"attempt": attempt})
        except Exception as e:
            if attempt < retries and _is_transient(e):
                wait = 2 ** attempt
                logger.warning("llm_retry", extra={"attempt": attempt, "wait_secs": wait})
                await asyncio.sleep(wait)
                last_exc = e
            else:
                raise
    raise last_exc


async def _extract_from_text(raw_text: str, document_type: str) -> list[dict]:
    if len(raw_text) > MAX_TEXT_CHARS:
        raise HTTPException(
            status_code=422,
            detail=(
                f"Document is too large ({len(raw_text):,} chars). "
                f"Maximum allowed is {MAX_TEXT_CHARS:,}."
            ),
        )
    try:
        prompt, item_schema, multi_schema = _get_prompt_and_schema(document_type)
        llm = get_llm()
        structured_llm = llm.with_structured_output(multi_schema)

        result: MultiInvoiceExtraction | MultiPaymentExtraction = await _invoke_with_retry(
            structured_llm,
            prompt.format(raw_text=raw_text),
        )

        items = result.records

        if not items:
            raise HTTPException(
                status_code=422,
                detail=f"No valid {document_type.lower()} records could be extracted from the document.",
            )

        results = []
        for item in items:
            if item.mismatch:
                if len(items) == 1:
                    _raise_mismatch(document_type, item.detected_type or "UNKNOWN")
                continue
            results.append(item.model_dump(exclude={"mismatch", "detected_type"}))

        if not results:
            raise HTTPException(
                status_code=422,
                detail=f"No valid {document_type.lower()} records could be extracted from the document.",
            )

        return results

    except HTTPException:
        raise
    except Exception as e:
        _handle_llm_error(e, document_type)



async def _extract_from_image(image_content: dict, document_type: str) -> list[dict]:
    try:
        _, item_schema, _ = _get_prompt_and_schema(document_type)
        llm = get_vision_llm()

        schema_fields = "\n".join(
            f"- {name}: {field.description}"
            for name, field in item_schema.model_fields.items()
            if name not in ("mismatch", "detected_type")
        )

        data_url = f"data:{image_content['media_type']};base64,{image_content['data']}"
        message = HumanMessage(content=[
            {
                "type": "image_url",
                "image_url": {"url": data_url},
            },
            {
                "type": "text",
                "text": (
                    f"STEP 1: Determine if this document contains {document_type}(s).\n\n"
                    f"STEP 2a: If it does NOT contain a {document_type}, return ONLY a JSON array:\n"
                    f'[{{"mismatch": true, "detected_type": "<PAYMENT|INVOICE|UNKNOWN>"}}]\n\n'
                    f"STEP 2b: If it DOES contain one or more {document_type}(s), extract each one.\n"
                    f"Return ONLY a valid JSON array where each element is one {document_type.lower()}.\n"
                    f"If only one {document_type.lower()} is present, still return an array with one element.\n"
                    f"Set mismatch=false for each. Do NOT invent values — use null for absent optional fields.\n\n"
                    f"Fields to extract for each {document_type.lower()}:\n"
                    f"{schema_fields}\n\n"
                    f"Always return a JSON array. Never return a plain object."
                ),
            },
        ])

        response = await _invoke_with_retry(llm, [message])
        parsed = _safe_json_parse(response.content)

        if parsed is None:
            raise HTTPException(
                status_code=422,
                detail="Could not read the document. Please ensure the image is clear and try again.",
            )

        items = parsed if isinstance(parsed, list) else [parsed]

        results = []
        for item in items:
            if item.get("mismatch"):
                if len(items) == 1:
                    _raise_mismatch(document_type, item.get("detected_type") or "UNKNOWN")
                continue
            try:
                validated = item_schema(**item)
                results.append(validated.model_dump(exclude={"mismatch", "detected_type"}))
            except ValidationError as exc:
                logger.warning(
                    "image_validation_failed",
                    extra={"doc_type": document_type, "errors": exc.errors()},
                )
                continue

        if not results:
            raise HTTPException(
                status_code=422,
                detail=(
                    f"The {document_type.lower()} image is missing critical fields or has unreadable data. "
                    "Please check the image and re-upload."
                ),
            )

        return results

    except HTTPException:
        raise
    except Exception as e:
        _handle_llm_error(e, document_type)



async def run_extraction(content: Union[str, dict], document_type: str) -> list[dict]:
    try:
        if isinstance(content, dict):
            return await _extract_from_image(content, document_type)
        return await _extract_from_text(content, document_type)
    except HTTPException:
        raise
    except Exception as e:
        _handle_llm_error(e, document_type)