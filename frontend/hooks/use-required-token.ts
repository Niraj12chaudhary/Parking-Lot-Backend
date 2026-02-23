'use client';

import { useEffect, useState } from 'react';

export function useRequiredToken() {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    setToken(window.localStorage.getItem('parking_auth_token'));
  }, []);

  return token;
}
