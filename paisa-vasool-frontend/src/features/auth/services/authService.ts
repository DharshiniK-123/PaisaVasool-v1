import axiosInstance from '../../../lib/axios';
import type { LoginPayload, LoginResponse, RegisterPayload, RegisterResponse } from '../types/index';

export const authService = {
  login: async (payload: LoginPayload): Promise<LoginResponse> => {
    const res = await axiosInstance.post<LoginResponse>('/users/login', payload);
    return res.data;
  },

  register: async (payload: RegisterPayload): Promise<RegisterResponse> => {
    const res = await axiosInstance.post<RegisterResponse>('/users/register', payload);
    return res.data;
  },

  logout: async (): Promise<void> => {
    await axiosInstance.post('/users/logout');
  },

  refresh: async (): Promise<{ access_token: string }> => {
    const res = await axiosInstance.post<{ access_token: string }>('/users/refresh');
    return res.data;
  },
};