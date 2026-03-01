import type { Middleware } from '@reduxjs/toolkit';

export const loggerMiddleware: Middleware = (_store) => (next) => (action) => {
  
  if (import.meta.env.MODE === 'development') {
    
    console.log('action:', action);
    
  }
  return next(action);
};