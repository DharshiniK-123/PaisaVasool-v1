export type ReminderStatus = 'SENT' | 'FAILED' | 'PENDING';

export interface Reminder {
  id: number;
  invoice_id?: number | null;
  customer_id?: number | null;
  customer_name?: string | null;
  customer_email?: string | null;
  message?: string | null;
  status?: ReminderStatus | string | null;
  sent_at?: string | null;
  error_message?: string | null;
  aging_config_id?: number | null;
  severity?: string | null;
  days_overdue?: number | null;
  [key: string]: unknown;
}

export interface ReminderState {
  reminders: Reminder[];
  loading: boolean;
  refreshing: boolean;
  runningJob: boolean;
  error: string | null;
  jobSuccess: string | null;
}
