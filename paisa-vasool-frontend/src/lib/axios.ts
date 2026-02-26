import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import env from '../config/env';
import type { AppStore } from '../app/store';

// ─── Lazy store injection ─────────────────────────────────────────────────────
// We can't import `store` directly here — it would create a circular dependency:
//   store → rootReducer → authSlice → axios → store
// Instead, we expose an `injectStore` function called from main.tsx AFTER the
// store is created. All interceptors access `_store` at call-time, not import-time.
let _store: AppStore;
export const injectStore = (store: AppStore) => { _store = store; };

const axiosInstance = axios.create({
  baseURL: env.API_BASE_URL,
  withCredentials: true, // send cookies automatically
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Request Interceptor ───────────────────────────────────────────────────────
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = _store?.getState().auth.accessToken;
    if (token && config.headers) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor ─────────────────────────────────────────────────────
let isRefreshing = false;
let failedQueue: Array<{ resolve: (v: unknown) => void; reject: (e: unknown) => void }> = [];

const processQueue = (error: AxiosError | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          if (originalRequest.headers) {
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
          }
          return axiosInstance(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const res = await axiosInstance.post<{ access_token: string }>('/users/refresh');
        const newToken = res.data.access_token;

        // Import actions here — safe because _store is already initialised by now
        const { setAccessToken } = await import('../features/auth/slices/authSlice');
        _store.dispatch(setAccessToken(newToken));

        processQueue(null, newToken);
        if (originalRequest.headers) {
          originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
        }
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as AxiosError, null);
        const { logout } = await import('../features/auth/slices/authSlice');
        _store.dispatch(logout());
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;