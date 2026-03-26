import type { Middleware } from '@reduxjs/toolkit';

export const loggerMiddleware: Middleware = () => (next) => (action) => next(action);