import axiosInstance from '../../../lib/axios';
import type { DashboardSummary, DashboardStats } from '../types';

const BASE = '/api/v1/payment_intake_matching/matching';

export const dashboardService = {
  async fetchSummary(): Promise<DashboardSummary> {
    const { data } = await axiosInstance.get(`${BASE}/dashboard/summary`);
    return data;
  },

  async fetchRecentMatches(limit = 10) {
    const { data } = await axiosInstance.get(`${BASE}/dashboard/recent?limit=${limit}`);
    return Array.isArray(data) ? data : [];
  },

  async fetchStats(): Promise<DashboardStats> {
    const { data } = await axiosInstance.get(`${BASE}/dashboard/stats`);
    return data;
  },
};
