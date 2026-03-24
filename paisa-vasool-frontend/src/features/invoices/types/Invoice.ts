export type PaymentStatus = 'PAID' | 'UNPAID' | 'PARTIAL' | 'OVERPAID';

export interface InvoiceMatch {
  match_id: number;
  match_status: string;
  matched_amount?: number | null;
  amount_pending?: number | null;
  match_reason?: string | null;
  payment_detail_id?: number | null;
  matched_at?: string | null;
}

export interface Invoice {
  id: number;
  invoice_number?: string | null;
  customer_name?: string | null;
  customer_email?: string | null;
  customer_phone?: string | null;
  total_amount?: number | null;
  paid_amount?: number | null;
  due_date?: string | null;
  invoice_date?: string | null;
  payment_status?: string | null;
  currency?: string | null;
  document_id?: number | null;
  is_deleted?: boolean;
  matches?: InvoiceMatch[];
  [key: string]: unknown;
}

export interface InvoiceState {
  invoices: Invoice[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
}