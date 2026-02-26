export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone_no?: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface ApiError {
  detail: string | { msg: string; detail: string };
}
