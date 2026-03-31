import axiosInstance from '../../../lib/axios';
import type { MatchRecord, MatchPaymentDetail, MatchInvoiceData, DiscrepancyRecord, SuggestedMatch } from '../types/Match';

const BASE = '/api/v1/payment_intake_matching/matching';

export const matchingService = {
  async fetchMatches(limit = 100): Promise<MatchRecord[]> {
    const { data } = await axiosInstance.get(`${BASE}/dashboard/recent?limit=${limit}`);
    return Array.isArray(data) ? data : [];
  },

  async fetchDiscrepancies(includeResolved = false): Promise<DiscrepancyRecord[]> {
    const { data } = await axiosInstance.get(
      `${BASE}/dashboard/discrepancies?include_resolved=${includeResolved}`
    );
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

  // ── Manual review endpoints ───────────────────────────────────────────────

  async fetchPendingReview(): Promise<SuggestedMatch[]> {
    const { data } = await axiosInstance.get(`${BASE}/pending-review`);
    return Array.isArray(data) ? data : [];
  },

  async approveMatch(paymentId: number, matchId: number): Promise<MatchRecord> {
    const { data } = await axiosInstance.patch(
      `${BASE}/payment/${paymentId}/matches/${matchId}/approve`
    );
    return data;
  },

  async rejectMatch(paymentId: number, matchId: number): Promise<MatchRecord> {
    const { data } = await axiosInstance.patch(
      `${BASE}/payment/${paymentId}/matches/${matchId}/reject`
    );
    return data;
  },

  async manualAssign(paymentId: number, invoiceId: number): Promise<MatchRecord> {
    const { data } = await axiosInstance.post(`${BASE}/payment/${paymentId}/assign`, {
      invoice_id: invoiceId,
    });
    return data;
  },
};
