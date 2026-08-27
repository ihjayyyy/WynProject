'use client';
import { useState } from 'react';
import LoginForm from '../../components/LoginForm/LoginForm';
import styles from './page.module.scss';
import { useRouter } from 'next/navigation';
import { login, storeAuthData } from '../../services/Auth';
import ConfirmModal from '../../components/ui/ConfirmModal/ConfirmModal';


export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConfirmOpen, setConfirmModal] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState('');
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [confirmVariant, setConfirmVariant] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [confirmEmployeeNumber, setConfirmEmployeeNumber] = useState('');

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

    storeAuthData(authData);

    if (!authData.confirmed) {
      setConfirmTitle('First Time Login');
      setConfirmMessage(
        'This is your first time logging in. Please change your password to confirm your account.',
      );
      setConfirmText('Change Password');
      setConfirmVariant('primary');
      setConfirmEmail(authData.email || '');
      setConfirmEmployeeNumber(authData.employeeNumber);
      setConfirmModal(true);
    } else {
      router.push('/dashboard');
    }
  };

  const handleConfirm = () => {
    setConfirmModal(false);
    router.push(`/changepassword?employeeNumber=${encodeURIComponent(confirmEmployeeNumber)}`);
    // router.push(`/changepassword?email=${encodeURIComponent(confirmEmail)}`);
  };

  const handleCancel = () => {
    setConfirmModal(false);
  };

  return (
    <main className={styles.container}>
      <LoginForm
        onLogin={handleLogin}
        errorMessage={error}
        isLoading={isLoading}
      />
      <ConfirmModal
        open={isConfirmOpen}
        title={confirmTitle}
        message={confirmMessage}
        confirmText={confirmText}
        confirmVariant={confirmVariant}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </main>
  );
}
