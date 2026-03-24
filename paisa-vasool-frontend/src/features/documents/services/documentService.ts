import axiosInstance from '../../../lib/axios';
import type {
  Document,
  InvoiceRecord,
  PaymentRecord,
  UploadResponse,
  JobStatusResponse,
  SaveResponse,
  DocumentType,
} from '../types/Document';

const BASE = '/api/v1/payment_intake_matching/documents';

function extractDetail(detail: unknown): string {
  if (!detail) return 'Unknown error';
  if (typeof detail === 'string') return detail;
  if (typeof detail === 'object') {
    const d = detail as Record<string, unknown>;
    const parts: string[] = [];
    if (d.message) parts.push(String(d.message));
    if (Array.isArray(d.errors)) parts.push(...(d.errors as string[]));
    if (parts.length) return parts.join(' · ');
    return JSON.stringify(detail);
  }
  return String(detail);
}

export function extractAxiosError(err: unknown): string {
  if (err && typeof err === 'object') {
    const e = err as Record<string, unknown>;
    const detail = (e?.response as Record<string, unknown>)?.data
      ? ((e.response as Record<string, unknown>).data as Record<string, unknown>)?.detail
      : null;
    if (detail) return extractDetail(detail);
    if (e?.message) return String(e.message);
  }
  return 'Unknown error';
}

async function pollUntilDone(
  jobId: string,
  maxAttempts = 60,
  intervalMs = 2000,
): Promise<JobStatusResponse> {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(res => setTimeout(res, intervalMs));
    const res  = await axiosInstance.get<JobStatusResponse>(`${BASE}/jobs/${jobId}/status`);
    const data = res.data;
    if (data.status === 'EXTRACTED') return data;
    if (data.status === 'FAILED') {
      throw new Error(extractDetail(data.error) || 'Document processing failed.');
    }
  }
  throw new Error('Document processing timed out. Please try again.');
}

export const documentService = {

  upload: async (file: File, documentType: DocumentType): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await axiosInstance.post<UploadResponse>(
      `${BASE}/upload?document_type=${documentType}`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return res.data;
  },

  pollJobStatus: pollUntilDone,

  pollJobUntilDone: pollUntilDone,

  saveRecords: async (
    documentId: number,
    documentType: DocumentType,
    records: (InvoiceRecord | PaymentRecord)[],
  ): Promise<SaveResponse> => {
    const res = await axiosInstance.post<SaveResponse>(`${BASE}/${documentId}/save`, {
      document_type: documentType,
      records,
    });
    return res.data;
  },

  list: async (): Promise<Document[]> => {
    const res = await axiosInstance.get<Document[]>(`${BASE}/`);
    return res.data;
  },

  getById: async (id: number): Promise<Document> => {
    const res = await axiosInstance.get<Document>(`${BASE}/${id}`);
    return res.data;
  },

  getInvoices: async (documentId: number): Promise<InvoiceRecord[]> => {
    const res = await axiosInstance.get<InvoiceRecord[]>(`${BASE}/${documentId}/invoices`);
    return res.data;
  },

  getPayments: async (documentId: number): Promise<PaymentRecord[]> => {
    const res = await axiosInstance.get<PaymentRecord[]>(`${BASE}/${documentId}/payments`);
    return res.data;
  },
};
