import axios from 'axios';

// Em produção, VITE_API_URL aponta para o backend no Railway.
// Em desenvolvimento, usa o proxy do Vite (vite.config.ts → localhost:3001).
const BASE_URL = import.meta.env.VITE_API_URL ?? '/api';

const api = axios.create({ baseURL: BASE_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('finanzza_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('finanzza_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
