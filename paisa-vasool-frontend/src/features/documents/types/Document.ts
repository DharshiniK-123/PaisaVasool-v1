export type DocumentType = 'INVOICE' | 'PAYMENT';

export interface Document {
  id: number;
  file_name: string;
  document_type: DocumentType;
  created_at: string;
  [key: string]: unknown;
}

export interface InvoiceRecord {
  id: number;
  invoice_number?: string | null;
  customer_name?: string | null;
  customer_email?: string | null;
  customer_phone?: string | null;
  total_amount?: number | null;
  paid_amount?: number | null;
  due_date?: string | null;
  invoice_date?: string | null;
  payment_status?: string | null;
  document_id?: number | null;
  [key: string]: unknown;
}

export interface PaymentRecord {
  id: number;
  payer_name?: string | null;
  payer_email?: string | null;
  payer_phone?: string | null;
  amount?: number | null;
  payment_date?: string | null;
  reference_number?: string | null;
  bank_name?: string | null;
  payment_mode?: string | null;
  notes?: string | null;
  document_id?: number | null;
  [key: string]: unknown;
}

export interface UploadResponse {
  document_id: number;
  file_name: string;
  status: string;
  [key: string]: unknown;
}

export interface DocumentState {
  uploading: boolean;
  uploadError: string | null;
  uploadedDocumentId: number | null;
  uploadedFileName: string | null;

  previewRows: (InvoiceRecord | PaymentRecord)[];
  previewLoading: boolean;
  previewError: string | null;

  documents: Document[];
  documentsLoading: boolean;
  documentsError: string | null;
}