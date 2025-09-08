

"use client";
import LoginForm from '../../components/LoginForm/LoginForm';
import styles from './page.module.scss';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();

  const handleLogin = (credentials) => {
    // Here you would normally validate credentials with an API
    // For now, just redirect to /supplier
    router.push('/supplier');
  };

  return (
    <main className={styles.container}>
      <LoginForm onLogin={handleLogin} />
    </main>
  );
}
