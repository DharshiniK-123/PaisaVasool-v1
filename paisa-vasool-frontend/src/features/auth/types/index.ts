export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  first_name: string;
  last_name: string;
  email: string;
  phone_no: string;  
  password: string;
}

export interface LoginResponse {
  user_id: string;
  email: string;
  access_token:string;
}

export interface RegisterResponse {
  message: string;
}
