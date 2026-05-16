/** API base — em produção use /api (mesmo servidor). Em dev: VITE_API_URL ou proxy Vite */
export const API_URL =
  import.meta.env.VITE_API_URL || '/api';
