'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthData } from '@/services/Auth';

export default function AuthGuard({ children }) {
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const authData = getAuthData();
    const isAuthenticated = Boolean(
      authData && (authData.token || authData.accessToken || authData.userId)
    );

    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }

    setIsReady(true);
  }, [router]);

  if (!isReady) {
    return null;
  }

  return children;
}