import type { AxiosError } from "axios";

export function extractErrorMessage(err: unknown): string {
  const axiosError = err as AxiosError<any>;

  if (import.meta.env.DEV) {
    console.error('[API Error]', axiosError?.response?.status, axiosError?.response?.data);
  }

  const data = axiosError?.response?.data;
  const status = axiosError?.response?.status;

  if (!data) return 'Something went wrong. Please try again.';
  if (status === 422) {
    const detail = data.detail;
    if (Array.isArray(detail)) {
      return detail.map((d: any) => d.msg).join(', ');
    }
    if (typeof detail === 'string') {
      return detail;
    }
    return 'Validation error';
  }

  if (typeof data.detail === 'string') return data.detail;
  if (typeof data.message === 'string') return data.message;
  if (typeof data.error === 'string') return data.error;
  if (status === 500) return 'Server error (500). Check the backend logs.';
  if (status === 413) return 'File is too large to upload.';
  if (status === 415) return 'Unsupported file type.';
  if (status === 401) return 'Not authenticated. Please log in again.';
  if (status === 403) return 'You do not have permission to do that.';
  return 'Something went wrong. Please try again.';
}