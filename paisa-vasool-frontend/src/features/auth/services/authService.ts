import axiosInstance from '../../../lib/axios';
import type { LoginPayload, LoginResponse } from '../types';

export const authService = {
  me: async () => {
    const res = await axiosInstance.get("/api/v1/users/auth/me");
    console.log(res.data)
    return res.data;
  },
  login: async (payload: LoginPayload): Promise<LoginResponse> => {
  const res = await axiosInstance.post<LoginResponse>(
    '/api/v1/users/login',
    payload
  );
  return res.data;
  },
  register: async (payload: { email: string; password: string }) => {
    await axiosInstance.post('/api/v1/users/register', payload);
  },
  logout: async () => {
    await axiosInstance.post('/api/v1/users/logout');
  },
};