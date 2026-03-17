import axiosInstance from '../../../lib/axios';
import type { FinanceUser, CreateUserPayload, UserActivityStat } from '../types';

export const adminService = {
  async listUsers(): Promise<FinanceUser[]> {
    const res = await axiosInstance.get<FinanceUser[]>('/api/v1/users/admin/users');
    return res.data;
  },

  async createUser(payload: CreateUserPayload): Promise<FinanceUser> {
    const res = await axiosInstance.post<FinanceUser>('/api/v1/users/admin/users', payload);
    return res.data;
  },

  async toggleUserStatus(userId: number): Promise<FinanceUser> {
    const res = await axiosInstance.patch<FinanceUser>(`/api/v1/users/admin/users/${userId}/toggle-status`);
    return res.data;
  },

  /**
   * Per-user activity stats from the payment intake & matching service.
   * Backend endpoint: GET /api/v1/payment_intake_matching/documents/stats
   */
  async getUserStats(): Promise<UserActivityStat[]> {
    const res = await axiosInstance.get<UserActivityStat[]>(
      '/api/v1/payment_intake_matching/documents/stats'
    );
    return res.data;
  },
};