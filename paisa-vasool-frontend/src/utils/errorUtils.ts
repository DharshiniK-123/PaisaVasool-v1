import type { AxiosError } from 'axios';
import type { ApiError } from '../types';

export function extractErrorMessage(err: unknown): string {
  const axiosError = err as AxiosError<ApiError>;
  const detail = axiosError?.response?.data?.detail;

  if (!detail) return 'Something went wrong. Please try again.';
  if (typeof detail === 'string') return detail;
  if (typeof detail === 'object' && 'detail' in detail) return detail.detail;

  return 'Something went wrong. Please try again.';
}
