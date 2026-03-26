export function extractErrorMessage(err: unknown): string {
  const axiosError = err as { 
    response?: { 
      data?: { 
        detail?: unknown; 
        message?: string; 
        error?: string 
      }; 
      status?: number 
    }; 
    message?: string 
  };

  if (import.meta.env.DEV) {
    console.error("[API Error]", axiosError);
  }

  const data = axiosError?.response?.data;

  if (data) {
    if (data.detail) {
      const detail = data.detail;
      if (typeof detail === 'string') return detail;
      if (typeof detail === 'object' && detail !== null) {
        if ('message' in detail) return String((detail as { message: unknown }).message);
        if (Array.isArray(detail)) {
          return detail
            .map((d: unknown) => {
              if (typeof d === 'object' && d !== null) {
                const entry = d as { msg?: string; message?: string };
                return entry.msg || entry.message || "Unknown error";
              }
              return String(d);
            })
            .join(", ");
        }
      }
      return JSON.stringify(detail);
    }
    if (data.message) return data.message;
    if (data.error) return data.error;
  }

  if (axiosError?.message) return axiosError.message;
  return "An unexpected error occurred. Please try again.";
}