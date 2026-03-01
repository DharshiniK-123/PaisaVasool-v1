import axiosInstance from '../../../lib/axios';

import type { LoginPayload, LoginResponse, RegisterPayload, RegisterResponse } from '../types/index';

export const authService = {
  me: async (): Promise<{ user_id: string; email: string }> => {
    const res = await axiosInstance.get("/api/v1/users/auth/me");
    return res.data;
  },
  
  login: async (payload: LoginPayload): Promise<LoginResponse> => {
    const res = await axiosInstance.post<LoginResponse>('/api/v1/users/login', payload);
    return res.data;
  },

  register: async (payload: RegisterPayload): Promise<RegisterResponse> => {
    const res = await axiosInstance.post<RegisterResponse>('/api/v1/users/register', payload);
    return res.data;
  },

  logout: async (): Promise<void> => {
    await axiosInstance.post('/api/v1/users/logout');
  },

  refresh: async (): Promise<{ access_token: string }> => {
    const res = await axiosInstance.post<{ access_token: string }>('/api/v1/users/refresh');
    return res.data;
  },
};