import axiosInstance from '../../../lib/axios';
import type { Invoice } from '../types/Invoice';

const BASE = '/api/v1/payment_intake_matching';

export const invoiceService = {
  async fetchAll(): Promise<Invoice[]> {
    const { data: docs } = await axiosInstance.get(`${BASE}/documents/`);
    const invoiceDocs = (Array.isArray(docs) ? docs : []).filter(
      (d: { document_type?: string }) => d.document_type === 'INVOICE'
    );
    const allInvoices: Invoice[] = [];
    await Promise.all(
      invoiceDocs.map(async (doc: { id: number }) => {
        try {
          const { data } = await axiosInstance.get(`${BASE}/documents/${doc.id}/invoices`);
          if (Array.isArray(data)) allInvoices.push(...data);
        } catch {}
      })
    );
    return allInvoices;
  },

  async delete(id: number): Promise<void> {
    await axiosInstance.delete(`${BASE}/documents/invoices/${id}`);
  },
};