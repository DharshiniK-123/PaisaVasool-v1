export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  UPLOAD:    '/upload',
  MATCHING:  '/matching',
  INVOICES:  '/invoices',
  PAYMENTS:  '/payments',
  REMINDERS: '/reminders',
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_USERS:     '/admin/users',
} as const;

export const AUTH_COOKIE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
} as const;