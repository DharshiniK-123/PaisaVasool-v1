const env = {
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || '',
  APP_NAME: import.meta.env.VITE_APP_NAME || 'PaisaVasool',
  NODE_ENV: import.meta.env.MODE,
} as const;

export type Env = typeof env;
export default env;