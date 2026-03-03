import axiosInstance from '../../../lib/axios';
import type { Document, InvoiceRecord, PaymentRecord, UploadResponse, DocumentType } from '../types/Document';

const BASE = '/api/v1/payment_intake_matching/documents';

export const documentService = {

  upload: async (file: File, documentType: DocumentType): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    console.log("formdata:", formData)
    console.log("file:", file)
    console.log("DOCUMENT TYPE RECEIVED:", documentType)
    const res = await axiosInstance.post<UploadResponse>(
      `${BASE}/upload?document_type=${documentType}`,
      formData
    );
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