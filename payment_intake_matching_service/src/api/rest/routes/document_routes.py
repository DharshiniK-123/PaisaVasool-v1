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


@router.post("/upload")
async def upload_document(
    document_type: Literal["INVOICE", "PAYMENT"] = Query(..., description="Type of documents being uploaded"),
    files: List[UploadFile] = File(..., description="One or more files to upload"),
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    if not files:
        raise HTTPException(status_code=400, detail="No files provided")
    results = []
    for file in files:
        try:
            result = await upload_and_process_document(file=file,document_type=document_type,db=db,)
            results.append({"file_name": file.filename,"status":    "success",**result,})
        except HTTPException as e:
            results.append({"file_name": file.filename,"status":    "failed","detail":    e.detail,})
    total   = len(results)
    success = sum(1 for r in results if r["status"] == "success")
    failed  = total - success
    return {
        "total":   total,
        "success": success,
        "failed":  failed,
        "results": results,
    }


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