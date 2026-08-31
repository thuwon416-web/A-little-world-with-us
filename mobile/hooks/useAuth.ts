import { useEffect, useState } from 'react';
import { getAuthToken } from '@/lib/auth';

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function load() {
      const token = await getAuthToken();
      if (mounted) {
        setIsAuthenticated(Boolean(token));
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, []);

  return { isAuthenticated };
}
