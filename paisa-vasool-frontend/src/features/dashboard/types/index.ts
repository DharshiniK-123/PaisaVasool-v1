import type { MatchRecord } from '../../matching/types/Match';

export interface DashboardSummary {
  FULL: MatchRecord[];
  PARTIAL: MatchRecord[];
  OVERPAYMENT: MatchRecord[];
  DUPLICATE: MatchRecord[];
  FAILED: MatchRecord[];
}

export interface DashboardStats {
  total_invoices?: number;
  total_payments?: number;
  matched_count?: number;
  unmatched_count?: number;
  total_matched_amount?: number;
  [key: string]: unknown;
}

export interface DashboardState {
  summary: DashboardSummary | null;
  recentMatches: MatchRecord[];
  stats: DashboardStats | null;
  loading: boolean;
  error: string | null;
}
