from fastapi import APIRouter, HTTPException, UploadFile, File, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Literal

from src.api.rest.dependencies import get_db, get_current_user
from src.core.services.document import upload_and_process_document
from src.data.models.postgres.document import Document
from src.data.models.postgres.invoice_data import InvoiceData
from src.data.models.postgres.payment_detail import PaymentDetail
from src.data.repositories.generic_repository import (
    get_instance_by_id,
    bulk_get_instance,
)

router = APIRouter(prefix="/documents", tags=["Documents"])

MAX_FILE_SIZE = 10 * 1024 * 1024

@router.post("/upload")
async def upload_document(
    document_type: Literal["INVOICE", "PAYMENT"] = Query(...),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File too large. Maximum allowed size is 10MB.")

    # ✅ Reset file position so upload_and_process_document can read it again
    await file.seek(0)

    print(file, "...........", document_type)
    try:
        result = await upload_and_process_document(
            file=file,
            document_type=document_type,
            db=db,
        )
        return {"file_name": file.filename, "status": "success", **result}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/")
async def list_documents(db: AsyncSession = Depends(get_db),user: dict = Depends(get_current_user),):
    documents = await bulk_get_instance(Document, db)
    return documents


@router.get("/{document_id}")
async def get_document(document_id: int,db: AsyncSession = Depends(get_db),user: dict = Depends(get_current_user),):
    doc = await get_instance_by_id(document_id, Document, db)
    if not doc:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Document not found")
    return doc


@router.get("/{document_id}/invoices")
async def get_document_invoices(document_id: int,db: AsyncSession = Depends(get_db),user: dict = Depends(get_current_user),):
    invoices = await bulk_get_instance(InvoiceData, db, document_id=document_id)
    return invoices


@router.get("/{document_id}/payments")
async def get_document_payments(document_id: int,db: AsyncSession = Depends(get_db),user: dict = Depends(get_current_user),):
    payments = await bulk_get_instance(PaymentDetail, db, document_id=document_id)
    return payments