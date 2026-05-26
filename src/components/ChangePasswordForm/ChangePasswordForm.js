'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import styles from '../LoginForm/LoginForm.module.scss';
import Button from '../ui/Button/Button';
import Input from '../ui/Input/Input';
import { FiMail, FiLock } from 'react-icons/fi';
import { changePassword } from '../../services/User';

import Logo from '@/assets/logo.jpg';

export default function ChangePasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const initialEmail = searchParams.get('email');
    if (initialEmail) {
      setEmail(initialEmail);
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password || !newPassword) {
      setErrorMessage('Please fill in all fields.');
      return;
    }

    setErrorMessage('');
    setSuccessMessage('');
    setIsLoading(true);

    const response = await changePassword({
      email,
      password,
      newPassword,
    });

    setIsLoading(false);

    if (response.error) {
      setErrorMessage(
        response.error || 'Unable to change password. Please try again.',
      );
      return;
    }

    const result = response.data;
    if (!result) {
      setErrorMessage('Password change failed.');
      return;
    }

    if (result.isSuccess === false) {
      setErrorMessage(
        result.error || result.message || 'Password change failed.',
      );
      return;
    }

    setSuccessMessage(
      'Password changed successfully. Redirecting to dashboard...',
    );
    setTimeout(() => {
      router.push('/dashboard');
    }, 1200);
  };

  return (
    <form className={styles.loginForm} onSubmit={handleSubmit}>
      <div className={styles.logoWrap}>
        <Image src={Logo} alt="Wyn Logo" width={200} height={100} />
      </div>
      <h2 className={styles.title}>Change Password</h2>
      <div className={styles.subtitle}>
        Please update your password to continue.
      </div>
      {(errorMessage || successMessage) && (
        <div className={successMessage ? styles.success : styles.error}>
          {errorMessage || successMessage}
        </div>
      )}
      <Input
        id="change-email"
        type="email"
        label="Email address"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        autoComplete="username"
        icon={<FiMail size={20} />}
      />
      <Input
        id="current-password"
        type="password"
        label="Current password"
        placeholder="••••••••"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoComplete="current-password"
        icon={<FiLock size={20} />}
      />
      <Input
        id="new-password"
        type="password"
        label="New password"
        placeholder="••••••••"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        autoComplete="new-password"
        icon={<FiLock size={20} />}
      />
      <Button type="submit" className={styles.signinBtn} disabled={isLoading}>
        {isLoading ? 'Changing password…' : 'Change Password'}
      </Button>
    </form>
  );
}
