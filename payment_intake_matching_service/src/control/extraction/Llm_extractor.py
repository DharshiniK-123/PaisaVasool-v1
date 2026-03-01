import json
import re
from fastapi import HTTPException
from src.control.extraction.llm_client import get_llm
from src.control.extraction.prompts import INVOICE_EXTRACT_PROMPT, PAYMENT_EXTRACT_PROMPT

INVOICE_REQUIRED = ["invoice_number", "invoice_date", "due_date", "total_amount"]
PAYMENT_REQUIRED = ["invoice_no", "payment_amount", "paid_date"]


async def run_extraction(raw_text: str, document_type: str) -> dict:
    llm = get_llm()
    prompt = ( INVOICE_EXTRACT_PROMPT.format(raw_text=raw_text) if document_type == "INVOICE" else PAYMENT_EXTRACT_PROMPT.format(raw_text=raw_text))
    try:
        response = await llm.ainvoke(prompt)
        raw = response.content.strip()
        raw = re.sub(r"^```(?:json)?\s*", "", raw)
        raw = re.sub(r"\s*```$", "", raw)
        data = json.loads(raw)
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=422,
            detail="Could not parse LLM response as JSON. Try re-uploading the document."
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM call failed: {str(e)}")
    required = INVOICE_REQUIRED if document_type == "INVOICE" else PAYMENT_REQUIRED
    missing = [
        f for f in required
        if not data.get(f) or str(data[f]).strip().lower() in ("", "null", "none")
    ]
    if missing:
        raise HTTPException(status_code=422,detail=f"Could not extract required fields: {', '.join(missing)}. "f"Please check the document contains these fields and re-upload." )

    return data