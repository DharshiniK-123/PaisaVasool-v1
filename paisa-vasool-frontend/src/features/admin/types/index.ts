export interface FinanceUser {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone_no: string;
  role: string;
  created_at: string | null;
}

export interface CreateUserPayload {
  first_name: string;
  last_name: string;
  email: string;
  phone_no: string;
  password: string;
}
