import { useState, useCallback } from 'react';
import api from '../api/client';

export function useAuth() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('finanzza_token'));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(async (username: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post<{ token: string }>('/auth/login', { username, password });
      const { token: t } = res.data;
      localStorage.setItem('finanzza_token', t);
      setToken(t);
      return true;
    } catch {
      setError('Usuário ou senha incorretos');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('finanzza_token');
    setToken(null);
  }, []);

  return { token, isAuthenticated: !!token, login, logout, loading, error };
}
