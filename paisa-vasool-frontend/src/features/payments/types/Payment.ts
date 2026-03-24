export interface Payment {
  id: number;
  payer_name?: string | null;
  payer_email?: string | null;
  payer_phone?: string | null;
  amount?: number | null;
  currency?: string | null;
  payment_date?: string | null;
  reference_number?: string | null;
  bank_name?: string | null;
  payment_mode?: string | null;
  notes?: string | null;
  document_id?: number | null;
  [key: string]: unknown;
}

export interface PaymentState {
  payments: Payment[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
}