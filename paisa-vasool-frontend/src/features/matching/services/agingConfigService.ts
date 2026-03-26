import axiosInstance from '../../../lib/axios';

const BASE_URL = '/api/v1/payment_intake_matching/aging-config';
const SCHEDULER_URL = '/api/v1/payment_intake_matching/scheduler/settings';

export interface AgingRule {
  id: number;
  due_days_from: number;
  due_days_to: number | null;
  severity: string;
  reminder_frequency: number | null;
  message_template: string;
}

export interface SchedulerSettings {
  run_hour: number;
  run_minute: number;
  is_enabled: boolean;
}

export const agingConfigService = {
  getRules: async () => {
    const res = await axiosInstance.get<AgingRule[]>(`${BASE_URL}/`);
    return Array.isArray(res.data) ? res.data : [];
  },

  addRule: async (rule: Partial<AgingRule>) => {
    const res = await axiosInstance.post<AgingRule>(`${BASE_URL}/`, rule);
    return res.data;
  },

  deleteRule: async (id: number) => {
    await axiosInstance.delete(`${BASE_URL}/${id}`);
  },

  getSchedulerSettings: async () => {
    const res = await axiosInstance.get<SchedulerSettings>(SCHEDULER_URL);
    return res.data;
  },

  updateSchedulerSettings: async (settings: SchedulerSettings) => {
    const { run_hour, run_minute, is_enabled } = settings;
    await axiosInstance.put(
      `${SCHEDULER_URL}?run_hour=${run_hour}&run_minute=${run_minute}&is_enabled=${is_enabled}`
    );
  },

  getDiscrepancies: async (includeResolved: boolean) => {
    const res = await axiosInstance.get<Record<string, unknown>[]>(
      `/api/v1/payment_intake_matching/matching/dashboard/discrepancies?include_resolved=${includeResolved}`
    );
    return res.data;
  },
};
