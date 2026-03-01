from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Literal
from datetime import date, datetime
from decimal import Decimal



class CustomerCreate(BaseModel):
    name   : str       = Field(..., max_length=100)
    email  : EmailStr
    phone  : Optional[str] = Field(None, max_length=20)

class CustomerResponse(BaseModel):
    id         : int
    name       : str
    email      : str
    phone      : Optional[str]
    created_at : datetime

    model_config = {"from_attributes": True}


class DocumentCreate(BaseModel):
    document_type : Literal["INVOICE", "PAYMENT"]
    file_name     : str = Field(..., max_length=255)
    file_type     : Literal["pdf", "csv", "xlsx"]
    storage_path  : str

class DocumentResponse(BaseModel):
    id            : int
    document_type : str
    file_name     : str
    file_type     : str
    storage_path  : str
    status        : str
    uploaded_at   : datetime

    model_config = {"from_attributes": True}




class InvoiceDataCreate(BaseModel):
    document_id    : int
    customer_id    : int
    invoice_number : str     = Field(..., max_length=100)
    invoice_date   : date
    due_date       : date
    total_amount   : Decimal = Field(..., gt=0, decimal_places=2)
    currency       : str     = Field(default="INR", max_length=10)
    gl_code        : Optional[str] = Field(None, max_length=50)

class InvoiceDataResponse(BaseModel):
    id             : int
    document_id    : int
    customer_id    : int
    invoice_number : str
    invoice_date   : date
    due_date       : date
    total_amount   : Decimal
    currency       : str
    gl_code        : Optional[str]
    updated_at     : datetime

    model_config = {"from_attributes": True}



class PaymentDetailCreate(BaseModel):
    document_id       : int
    customer_id       : int
    invoice_no        : str     = Field(..., max_length=100)
    payment_amount    : Decimal = Field(..., gt=0, decimal_places=2)
    currency          : str     = Field(default="INR", max_length=10)
    paid_date         : date
    payment_reference : Optional[str] = Field(None, max_length=100)

class PaymentDetailResponse(BaseModel):
    id                : int
    document_id       : int
    customer_id       : int
    invoice_no        : str
    payment_amount    : Decimal
    currency          : str
    paid_date         : date
    payment_reference : Optional[str]

    model_config = {"from_attributes": True}




class MatchingCreate(BaseModel):
    payment_detail_id : int
    invoice_id        : int
    matched_amount    : Decimal = Field(..., gt=0, decimal_places=2)
    amount_pending    : Optional[Decimal] = Field(None, decimal_places=2)
    match_score       : Decimal = Field(..., ge=0, le=100, decimal_places=2)
    match_status      : Literal["FULL", "PARTIAL", "FAILED"]

class MatchingResponse(BaseModel):
    id                : int
    payment_detail_id : int
    invoice_id        : int
    matched_amount    : Decimal
    amount_pending    : Optional[Decimal]
    match_score       : Decimal
    match_status      : str
    created_at        : datetime

    model_config = {"from_attributes": True}




class AgingConfigCreate(BaseModel):
    severity           : Literal["MEDIUM", "HIGH", "CRITICAL"]
    due_days_from      : int = Field(..., ge=0)
    due_days_to        : Optional[int] = Field(None, ge=1)  
    reminder_frequency : int = Field(..., ge=1)            

class AgingConfigResponse(BaseModel):
    id                 : int
    severity           : str
    due_days_from      : int
    due_days_to        : Optional[int]
    reminder_frequency : int

    model_config = {"from_attributes": True}



class ReminderLogCreate(BaseModel):
    customer_id : int
    invoice_id  : int
    severity    : Literal[ "MEDIUM", "HIGH", "CRITICAL"]
    subject     : str = Field(..., max_length=255)
    body        : str
    channel     : Literal["EMAIL"] = "EMAIL"
    status      : Literal["SENT", "FAILED"]

class ReminderLogResponse(BaseModel):
    id          : int
    customer_id : int
    invoice_id  : int
    severity    : str
    subject     : str
    body        : str
    channel     : str
    status      : str
    sent_at     : datetime

    model_config = {"from_attributes": True}