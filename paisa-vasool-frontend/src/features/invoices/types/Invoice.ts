export type PaymentStatus = 'PAID' | 'UNPAID' | 'PARTIAL' | 'OVERPAID';

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
  document_id?: number | null;
  [key: string]: unknown;
}

export interface InvoiceState {
  invoices: Invoice[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
}
