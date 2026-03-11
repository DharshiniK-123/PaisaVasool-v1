import axiosInstance from '../../../lib/axios';
import type { FinanceUser, CreateUserPayload } from '../types';

export const adminService = {
  async listUsers(): Promise<FinanceUser[]> {
    const res = await axiosInstance.get<FinanceUser[]>('/api/v1/users/admin/users');
    return res.data;
  },

  async createUser(payload: CreateUserPayload): Promise<FinanceUser> {
    const res = await axiosInstance.post<FinanceUser>('/api/v1/users/admin/users', payload);
    return res.data;
  },
};
