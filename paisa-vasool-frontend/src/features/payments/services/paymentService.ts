import axiosInstance from '../../../lib/axios';
import type { Payment } from '../types/Payment';

const BASE = '/api/v1/payment_intake_matching';

export const paymentService = {
  async fetchAll(): Promise<Payment[]> {
    const { data: docs } = await axiosInstance.get(`${BASE}/documents/`);
    const paymentDocs = (Array.isArray(docs) ? docs : []).filter(
      (d: { document_type?: string }) => d.document_type === 'PAYMENT'
    );
    const allPayments: Payment[] = [];
    await Promise.all(
      paymentDocs.map(async (doc: { id: number }) => {
        try {
          const { data } = await axiosInstance.get(`${BASE}/documents/${doc.id}/payments`);
          if (Array.isArray(data)) allPayments.push(...data);
        } catch {}
      })
    );
    return allPayments;
  },

  async delete(id: number): Promise<void> {
    await axiosInstance.delete(`${BASE}/documents/payments/${id}`);
  },
};