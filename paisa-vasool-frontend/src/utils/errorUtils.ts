import type { AxiosError } from "axios";

export function extractErrorMessage(err: unknown): string {
  const axiosError = err as AxiosError<any>;

  if (import.meta.env.DEV) {
    console.error("[API Error]", axiosError);
  }

  // network error
  if (!axiosError.response) {
    return axiosError.message || "Network error. Please try again.";
  }

  const { data, status } = axiosError.response;

  if (!data) {
    return "Something went wrong. Please try again.";
  }

  // FastAPI validation errors
  if (status === 422) {
    const detail = data.detail;

    if (typeof detail === "string") {
      return detail;
    }

    if (Array.isArray(detail)) {
      return detail.map((d: any) => d.msg || d.message).join(", ");
    }

    if (typeof detail === "object" && detail.message) {
      return detail.message;
    }

    return "Validation error";
  }

  // generic detail
  if (typeof data.detail === "string") {
    return data.detail;
  }

  if (typeof data.message === "string") {
    return data.message;
  }

  if (typeof data.error === "string") {
    return data.error;
  }

  switch (status) {
    case 500:
      return "Server error (500). Check backend logs.";
    case 413:
      return "File is too large.";
    case 415:
      return "Unsupported file type.";
    case 401:
      return "Please login again.";
    case 403:
      return "Permission denied.";
  }

  return "Something went wrong. Please try again.";
}