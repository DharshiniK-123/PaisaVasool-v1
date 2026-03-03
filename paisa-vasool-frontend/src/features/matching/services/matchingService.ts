import axiosInstance from '../../../lib/axios';
import type { MatchRecord, MatchPaymentDetail, MatchInvoiceData } from '../types/Match';

const BASE = '/api/v1/payment_intake_matching/matching';

export const matchingService = {
  async fetchMatches(limit = 200): Promise<MatchRecord[]> {
    const { data } = await axiosInstance.get(`${BASE}/dashboard/recent?limit=${limit}`);
    return Array.isArray(data) ? data : [];
  },

  async fetchUnmatchedPayments(): Promise<MatchPaymentDetail[]> {
    const { data } = await axiosInstance.get(`${BASE}/dashboard/unmatched-payments`);
    return Array.isArray(data) ? data : [];
  },

  async fetchUnmatchedInvoices(): Promise<MatchInvoiceData[]> {
    const { data } = await axiosInstance.get(`${BASE}/dashboard/unmatched-invoices`);
    return Array.isArray(data) ? data : [];
  },
};
