'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import styles from '../LoginForm/LoginForm.module.scss';
import Button from '../ui/Button/Button';
import Input from '../ui/Input/Input';
import { FiHash, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import { changePassword } from '../../services/User';

import Logo from '@/assets/logo.jpg';

export default function ChangePasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [employeeNumber, setEmployeeNumber] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  useEffect(() => {
    const initialEmployeeNumber = searchParams.get('employeeNumber');
    if (initialEmployeeNumber) {
      setEmployeeNumber(initialEmployeeNumber);
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!employeeNumber || !oldPassword || !newPassword) {
      setErrorMessage('Please fill in all fields.');
      return;
    }

    setErrorMessage('');
    setSuccessMessage('');
    setIsLoading(true);

    const response = await changePassword({
      employeeNumber,
      oldPassword,
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
        id="change-employee-number"
        type="text"
        label="Employee number"
        placeholder="e.g. EMP-00123"
        value={employeeNumber}
        onChange={(e) => setEmployeeNumber(e.target.value)}
        autoComplete="username"
        icon={<FiHash size={20} />}
      />
      <div style={{ position: 'relative' }}>
        <Input
          id="current-password"
          type={showCurrentPassword ? 'text' : 'password'}
          label="Current password"
          placeholder="••••••••"
          value={oldPassword}
          onChange={(e) => setOldPassword(e.target.value)}
          autoComplete="current-password"
          icon={<FiLock size={20} />}
        />
        <button
          type="button"
          onClick={() => setShowCurrentPassword((prev) => !prev)}
          aria-label={showCurrentPassword ? 'Hide password' : 'Show password'}
          title={showCurrentPassword ? 'Hide password' : 'Show password'}
          className={styles.togglePasswordBtn}
        >
          {showCurrentPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
        </button>
      </div>
      <div style={{ position: 'relative' }}>
        <Input
          id="new-password"
          type={showNewPassword ? 'text' : 'password'}
          label="New password"
          placeholder="••••••••"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          autoComplete="new-password"
          icon={<FiLock size={20} />}
        />
        <button
          type="button"
          onClick={() => setShowNewPassword((prev) => !prev)}
          aria-label={showNewPassword ? 'Hide password' : 'Show password'}
          title={showNewPassword ? 'Hide password' : 'Show password'}
          className={styles.togglePasswordBtn}
        >
          {showNewPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
        </button>
      </div>
      <Button type="submit" className={styles.signinBtn} disabled={isLoading}>
        {isLoading ? 'Changing password…' : 'Change Password'}
      </Button>
    </form>
  );
}