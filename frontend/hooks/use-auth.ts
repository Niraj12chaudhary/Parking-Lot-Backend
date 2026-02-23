'use client';

import { useEffect, useState } from 'react';

const TOKEN_KEY = 'parking_auth_token';

export function useAuthToken() {
  const [token, setTokenState] = useState<string | null>(null);

  useEffect(() => {
    const existing = window.localStorage.getItem(TOKEN_KEY);
    if (existing) {
      setTokenState(existing);
    }
  }, []);

  const setToken = (nextToken: string) => {
    window.localStorage.setItem(TOKEN_KEY, nextToken);
    setTokenState(nextToken);
  };

  const clearToken = () => {
    window.localStorage.removeItem(TOKEN_KEY);
    setTokenState(null);
  };

  return {
    token,
    setToken,
    clearToken,
    isAuthenticated: Boolean(token),
  };
}
