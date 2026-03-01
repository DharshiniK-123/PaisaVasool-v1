INVOICE_EXTRACT_PROMPT = """
You are a financial document parser. Extract structured data from the following invoice text.

Return ONLY a valid JSON object with exactly these fields:
{{
    "invoice_number": "string - invoice ID or number (e.g. INV-001, #21236)",
    "invoice_date":   "string - date in YYYY-MM-DD format",
    "due_date":       "string - due date in YYYY-MM-DD format. If not present, calculate 30 days after invoice_date and return that",
    "total_amount":   "number - final amount due (Balance Due > Grand Total > Total > Amount Due). No currency symbols, just the number",
    "currency":       "string - 3-letter code: INR, USD, EUR, GBP. Infer from symbols: $ = USD, Rs/₹ = INR, € = EUR, £ = GBP. If not found default to USD",
    "customer_name":  "string - name of the customer being billed, or null",
    "customer_email": "string - customer email address, or null",
    "gl_code":        "string - general ledger code if present, or null"
}}

Rules:
- Convert ANY date format (Oct 25 2012, 25/10/2012, 25-10-2012 etc.) to YYYY-MM-DD
- For due_date: if missing from document, add 30 days to invoice_date and return that date
- For total_amount: return only the number, no commas, no currency symbols (e.g. 144268.82)
- For currency: infer from symbols in document, default to USD if nothing found
- For missing optional fields return null
- Return ONLY the JSON object, no explanation, no markdown, no code blocks

Invoice text:
{raw_text}
"""

PAYMENT_EXTRACT_PROMPT = """
You are a financial document parser. Extract structured data from the following payment document.

Return ONLY a valid JSON object with exactly these fields:
{{
    "invoice_no":         "string - invoice number this payment is for",
    "payment_amount":     "number - amount paid. No currency symbols, just the number (e.g. 144268.82)",
    "paid_date":          "string - payment date in YYYY-MM-DD format",
    "payment_reference":  "string - UTR number / bank reference / transaction ID, or null",
    "currency":           "string - 3-letter code: INR, USD, EUR, GBP. Infer from symbols: $ = USD, Rs/₹ = INR, € = EUR, £ = GBP. Default to INR if not found",
    "customer_name":      "string - name of person or company who made the payment, or null",
    "customer_email":     "string - customer email address, or null"
}}

Rules:
- Convert ANY date format to YYYY-MM-DD
- For payment_amount: return only the number, no commas, no currency symbols
- For currency: infer from symbols, default to INR if nothing found
- For missing optional fields return null
- Return ONLY the JSON object, no explanation, no markdown, no code blocks

Payment document text:
{raw_text}
"""