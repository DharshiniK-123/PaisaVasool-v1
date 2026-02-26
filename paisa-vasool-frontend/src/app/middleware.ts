import type { Middleware } from '@reduxjs/toolkit';

export const loggerMiddleware: Middleware = (_store) => (next) => (action) => {
  if (import.meta.env.MODE === 'development') {
    console.groupCollapsed(`[Redux] ${(action as { type: string }).type}`);
    console.log('action:', action);
    console.groupEnd();
  }
  return next(action);
};