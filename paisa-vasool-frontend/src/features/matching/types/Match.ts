export type MatchStatus = 'FULL' | 'PARTIAL' | 'OVERPAYMENT' | 'DUPLICATE' | 'FAILED';

export interface MatchRecord {
  id: number;
  payment_detail_id: number;
  invoice_id: number;
  match_status: MatchStatus;
  matched_amount?: number ;
  discrepancy_amount?: number ;
  match_notes?: string ;
  created_at: string;
  [key: string]: unknown;
}

export interface MatchPaymentDetail {
  id: number;
  amount?: number ;
  payer_name?: string ;
  payment_date?: string ;
  reference_number?: string ;
  bank_name?: string ;
  [key: string]: unknown;
}

export interface MatchInvoiceData {
  id: number;
  invoice_number?: string ;
  customer_name?: string ;
  total_amount?: number ;
  due_date?: string ;
  payment_status?: string ;
  [key: string]: unknown;
}

export interface MatchingState {
  matches: MatchRecord[];
  unmatchedPayments: MatchPaymentDetail[];
  unmatchedInvoices: MatchInvoiceData[];
  loading: boolean;
  refreshing: boolean;
  unmatchedPaymentsLoading: boolean;
  unmatchedInvoicesLoading: boolean;
  error: string | null;
}
