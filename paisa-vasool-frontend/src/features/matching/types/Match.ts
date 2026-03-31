export type MatchStatus =
  | 'FULL'
  | 'PARTIAL'
  | 'OVERPAYMENT'
  | 'DUPLICATE'
  | 'FAILED'
  | 'SUGGESTED'
  | 'MANUALLY_MATCHED';

export interface MatchRecord {
  id: number;
  payment_detail_id: number;
  invoice_id: number | null;
  match_status: MatchStatus;
  match_score?: number;
  matched_amount?: number;
  amount_pending?: number;
  match_notes?: string;
  match_reason?: string;
  is_resolved?: boolean;
  resolved_reason?: string;
  created_at: string;
  [key: string]: unknown;
}

export interface SuggestedMatch {
  match_id: number;
  payment_id: number;
  invoice_id: number;
  invoice_number: string;
  invoice_amount: number;
  payment_amount: number;
  matched_amount: number;
  amount_pending: number | null;
  match_score: number;
  match_reason: string | null;
  currency: string;
  paid_date: string;
  created_at: string;
}

export interface DiscrepancyRecord {
  id: number;
  match_status: MatchStatus;
  match_reason?: string;
  matched_amount?: number;
  is_resolved: boolean;
  resolved_reason?: string;
  created_at: string;
  invoice_no?: string;
  payment_amount?: number;
  currency?: string;
  paid_date?: string;
  payer_name?: string;
  payer_email?: string;
  payment_detail_id?: number;
}

export interface MatchPaymentDetail {
  id: number;
  amount?: number;
  payer_name?: string;
  payment_date?: string;
  reference_number?: string;
  bank_name?: string;
  [key: string]: unknown;
}

export interface MatchInvoiceData {
  id: number;
  invoice_number?: string;
  customer_name?: string;
  total_amount?: number;
  due_date?: string;
  payment_status?: string;
  [key: string]: unknown;
}

export interface MatchingState {
  matches: MatchRecord[];
  discrepancies: DiscrepancyRecord[];
  unmatchedPayments: MatchPaymentDetail[];
  unmatchedInvoices: MatchInvoiceData[];
  pendingReview: SuggestedMatch[];
  loading: boolean;
  refreshing: boolean;
  discrepanciesLoading: boolean;
  unmatchedPaymentsLoading: boolean;
  unmatchedInvoicesLoading: boolean;
  pendingReviewLoading: boolean;
  error: string | null;
}
