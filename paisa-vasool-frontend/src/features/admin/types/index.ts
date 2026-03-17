export interface FinanceUser {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone_no: string;
  role: string;
  is_active: string;
  created_at: string | null;
}

export interface CreateUserPayload {
  first_name: string;
  last_name: string;
  email: string;
  phone_no: string;
  password: string;
}

/**
 * Returned by GET /api/v1/users/admin/users/stats
 * This endpoint needs to be added to the backend.
 * Until it exists, adminService.getUserStats() will throw and the
 * dashboard will gracefully degrade (columns show "—").
 */
export interface UserActivityStat {
  user_id:           number;
  invoices_uploaded: number;
  payments_uploaded: number;
  matches_made:      number;
  last_active:       string | null; // ISO datetime string
}