'use client';
import { useState } from 'react';
import LoginForm from '../../components/LoginForm/LoginForm';
import styles from './page.module.scss';
import { useRouter } from 'next/navigation';
import { login } from '../../services/Auth';

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (credentials) => {
    setError('');
    setIsLoading(true);

    const response = await login(credentials);
    setIsLoading(false);

    if (response.error) {
      setError('Unable to sign in. Please try again.');
      return;
    }

    const authData = response.data;
    if (
      !authData ||
      (!authData.token && !authData.accessToken && !authData.userId)
    ) {
      setError('Invalid login response from server.');
      return;
    }

    try {
      sessionStorage.setItem('auth', JSON.stringify(authData));
    } catch (storageError) {
      console.warn('Unable to persist auth data:', storageError);
    }

    router.push('/dashboard');
  };

  return (
    <main className={styles.container}>
      <LoginForm
        onLogin={handleLogin}
        errorMessage={error}
        isLoading={isLoading}
      />
    </main>
  );
}
