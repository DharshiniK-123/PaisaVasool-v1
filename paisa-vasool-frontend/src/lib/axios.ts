import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import env from '../config/env';
import type { AppStore } from '../app/store';

let _store: AppStore;
export const injectStore = (store: AppStore) => { _store = store; };

const axiosInstance = axios.create({
  baseURL: env.API_BASE_URL,
  withCredentials: true, 
});
axiosInstance.interceptors.request.use(
  (config) => {
    const token = _store?.getState().auth.accessToken;
    if (token && config.headers) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (v: unknown) => void;
  reject: (e: unknown) => void;
}> = [];

const processQueue = (error: AxiosError | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

const SKIP_REFRESH_URLS = [
  '/api/v1/users/login',
  '/api/v1/users/register',
  '/api/v1/users/refresh',
  '/api/v1/users/logout',
];

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    const isSkipped = SKIP_REFRESH_URLS.some((url) =>
      originalRequest?.url?.includes(url)
    );
    if (error.response?.status === 401 && !originalRequest._retry && !isSkipped) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers['Authorization'] = `Bearer ${token}`;
            }
            return axiosInstance(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const res = await axiosInstance.post<{ access_token: string }>('/api/v1/users/refresh');
        const newToken = res.data.access_token;
        const { setAccessToken } = await import('../features/auth/slices/authSlice');
        _store.dispatch(setAccessToken(newToken));
        processQueue(null, newToken);
        if (originalRequest.headers) {
          originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
        }
        return axiosInstance(originalRequest);

      } catch (refreshError) {
        processQueue(refreshError as AxiosError, null);

        const isAuthenticated = _store?.getState().auth.isAuthenticated;
        if (isAuthenticated) {
          const { logout } = await import('../features/auth/slices/authSlice');
          _store.dispatch(logout());
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;