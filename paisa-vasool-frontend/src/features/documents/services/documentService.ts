import axiosInstance from '../../../lib/axios';
import type {
  Document, InvoiceRecord, PaymentRecord,
  UploadResponse, JobStatusResponse, SaveResponse, DocumentType,
} from '../types/Document';

const BASE = '/api/v1/payment_intake_matching/documents';

export const documentService = {

  upload: async (file: File, documentType: DocumentType): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await axiosInstance.post<UploadResponse>(
      `${BASE}/upload?document_type=${documentType}`,
      formData
    );
    return res.data;
  },

  pollJobStatus: async (jobId: string): Promise<JobStatusResponse> => {
    const MAX_ATTEMPTS = 60;  
    const INTERVAL_MS  = 2000;

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      await new Promise((res) => setTimeout(res, INTERVAL_MS));

      const res = await axiosInstance.get<JobStatusResponse>(`${BASE}/jobs/${jobId}/status`);
      const data = res.data;

      if (data.status === 'EXTRACTED') return data;
      if (data.status === 'FAILED') throw new Error(data.error || 'Document processing failed.');
    }

    throw new Error('Document processing timed out. Please try again.');
  },

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