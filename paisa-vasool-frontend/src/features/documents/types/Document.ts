export type DocumentType = 'INVOICE' | 'PAYMENT';

export interface Document {
  id: number;
  file_name: string;
  document_type: DocumentType;
  status: string;
  created_at: string;
  [key: string]: unknown;
}

export interface InvoiceRecord {
  id?: number;
  invoice_number?: string | null;
  customer_name?: string | null;
  customer_email?: string | null;
  total_amount?: number | null;
  due_date?: string | null;
  invoice_date?: string | null;
  currency?: string | null;
  gl_code?: string | null;
  document_id?: number | null;
  [key: string]: unknown;
}

export interface PaymentRecord {
  id?: number;
  invoice_no?: string | null;
  payer_name?: string | null;
  payer_email?: string | null;
  payment_amount?: number | null;
  paid_date?: string | null;
  payment_reference?: string | null;
  currency?: string | null;
  document_id?: number | null;
  [key: string]: unknown;
}

export interface UploadResponse {
  document_id: number;
  file_name: string;
  status: string;
  job_id: string;
  message?: string;
}

export interface JobStatusResponse {
  job_id: string;
  status: 'PROCESSING' | 'EXTRACTED' | 'FAILED';
  document_id?: number;
  records_count?: number;
  preview_data?: (InvoiceRecord | PaymentRecord)[];
  error?: string;
  message?: string;
}

export interface SaveResponse {
  document_id: number;
  status: string;
  records_saved: number;
  message: string;
}

export interface DocumentState {
  uploading: boolean;
  uploadError: string | null;
  uploadedDocumentId: number | null;
  uploadedFileName: string | null;
  uploadedJobId: string | null;

  processing: boolean;
  processError: string | null;

  previewRows: (InvoiceRecord | PaymentRecord)[];

  saving: boolean;
  saveError: string | null;
  savedCount: number | null;

  documents: Document[];
  documentsLoading: boolean;
  documentsError: string | null;
}