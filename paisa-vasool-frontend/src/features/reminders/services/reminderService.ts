import axiosInstance from '../../../lib/axios';
import type { Reminder } from '../types/Reminder';

const BASE = '/api/v1/payment_intake_matching';

export const reminderService = {
  async fetchAll(): Promise<Reminder[]> {
    const { data } = await axiosInstance.get(`${BASE}/aging/reminders`);
    return Array.isArray(data) ? data : [];
  },

  async runAgingJob(): Promise<void> {
    await axiosInstance.post(`${BASE}/aging/run`);
  },
};
