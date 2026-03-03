INVOICE_EXTRACT_PROMPT = """
You are a financial document parser. Extract structured data from the following invoice text.

Rules:
- Convert ANY date format (Oct 25 2012, 25/10/2012, 01 Dec 2024 etc.) to YYYY-MM-DD
- For due_date: if not present in the document, calculate invoice_date + 30 days
- For total_amount: use the FINAL amount (Balance Due > Grand Total > Total > Amount Due). Numbers only, no symbols
- For currency: infer from symbols — $ = USD, ₹/Rs = INR, € = EUR, £ = GBP. Default to USD if not found
- For optional fields (customer_name, customer_email, gl_code): return null if not present

Invoice text:
{raw_text}
"""

PAYMENT_EXTRACT_PROMPT = """
You are a financial document parser. Extract structured data from the following payment document.

Rules:
- Convert ANY date format to YYYY-MM-DD
- For payment_amount: numbers only, no currency symbols or commas
- For currency: infer from symbols — $ = USD, ₹/Rs = INR, € = EUR, £ = GBP. Default to INR if not found
- For optional fields (payment_reference, customer_name, customer_email): return null if not present

Payment document text:
{raw_text}
"""