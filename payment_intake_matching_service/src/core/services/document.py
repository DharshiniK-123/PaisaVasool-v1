import pandas as pd
from fastapi import UploadFile, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from src.data.models.postgres.document import Document
from src.data.models.postgres.invoice_data import InvoiceData
from src.data.models.postgres.payment_detail import PaymentDetail
from src.data.models.postgres.customer import Customer
from src.data.repositories.generic_repository import (insert_instance,get_instance_by_any,update_instance_by_id)
from src.core.services.storage_service import save_file_locally
from src.core.services.extraction_service import extract_text
from src.control.extraction.Llm_extractor import run_extraction

ALLOWED_EXTENSIONS = {"pdf", "csv", "xlsx", "xls"}


async def upload_and_process_document(file: UploadFile,document_type: str,   db: AsyncSession,) -> dict:
    original_name = file.filename or ""
    extension = original_name.rsplit(".", 1)[-1].lower() if "." in original_name else ""

    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException( status_code=400, detail=f"Unsupported file type '.{extension}'. Allowed: pdf, csv, xlsx")

    storage_path, file_type = await save_file_locally(file, document_type)

    await insert_instance( Document, db, document_type=document_type, file_name=original_name, file_type=file_type, storage_path=storage_path, status="UPLOADED")
    document = await get_instance_by_any(Document, db, {"storage_path": storage_path})
    document_id = document.id

    try:
        extracted = extract_text(storage_path, file_type)
    except HTTPException:
        await update_instance_by_id(document_id, Document, db, status="FAILED")
        raise
    try:
        if file_type == "pdf":
            inserted = await _process_single(extracted, document_type, document_id, db)
        else:
            inserted = await _process_dataframe(extracted, document_type, document_id, db)

        await update_instance_by_id(document_id, Document, db, status="PARSED")

    except HTTPException:
        await update_instance_by_id(document_id, Document, db, status="FAILED")
        raise
    except Exception as e:
        await update_instance_by_id(document_id, Document, db, status="FAILED")
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")
    return {
        "document_id":   document_id,
        "status":        "PARSED",
        "records_saved": inserted,
    }


async def _process_single( raw_text: str, document_type: str, document_id: int, db: AsyncSession,) -> int:
    data = await run_extraction(raw_text, document_type)
    customer_id = await _resolve_customer(name=data.pop("customer_name", None),email=data.pop("customer_email", None),db=db,)
    model = InvoiceData if document_type == "INVOICE" else PaymentDetail
    await insert_instance(model, db, document_id=document_id, customer_id=customer_id, **data)
    return 1


async def _process_dataframe( df: pd.DataFrame,document_type: str,document_id: int,db: AsyncSession,) -> int:
    count = 0
    for _, row in df.iterrows():
        row_text = "\n".join(f"{col}: {val}" for col, val in row.items() if pd.notna(val))
        data = await run_extraction(row_text, document_type)
        customer_id = await _resolve_customer(
            name=data.pop("customer_name", None),
            email=data.pop("customer_email", None),
            db=db,
        )
        model = InvoiceData if document_type == "INVOICE" else PaymentDetail
        await insert_instance(model, db, document_id=document_id, customer_id=customer_id, **data)
        count += 1
    return count


async def _resolve_customer(name: str | None,email: str | None,db: AsyncSession,) -> int:
    if not email or str(email).lower() == "null":
        raise HTTPException(status_code=422,detail="Customer email not found in document. ""Email is required for reminders. ""Add the customer manually first ")
    existing = await get_instance_by_any(Customer, db, {"email": email})
    if existing:
        return existing.id
    await insert_instance(Customer, db, name=name or email.split("@")[0], email=email)
    created = await get_instance_by_any(Customer, db, {"email": email})
    return created.id