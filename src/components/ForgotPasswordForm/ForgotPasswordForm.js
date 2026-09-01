'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import styles from '../LoginForm/LoginForm.module.scss';
import Button from '../ui/Button/Button';
import Input from '../ui/Input/Input';
import { FiArrowLeft, FiHash, FiLock, FiEye, FiEyeOff, FiKey } from 'react-icons/fi';
import { forgotPassword, verifyForgotPassword } from '../../services/User';

import Logo from '@/assets/logo.jpg';

export default function ForgotPasswordForm() {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1 = request OTP, 2 = verify + reset

  const [employeeNumber, setEmployeeNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    if (!employeeNumber) {
      setErrorMessage('Please enter your employee number.');
      return;
    }

    setErrorMessage('');
    setSuccessMessage('');
    setIsLoading(true);

    const response = await forgotPassword({ employeeNumber });

    setIsLoading(false);

    if (response.error) {
      setErrorMessage(
        response.error || 'Unable to send OTP. Please try again.',
      );
      return;
    }

    const result = response.data;
    if (result && result.isSuccess === false) {
      setErrorMessage(
        result.error || result.message || 'Unable to send OTP.',
      );
      return;
    }

    setSuccessMessage('An OTP has been sent to your registered email.');
    setStep(2);
  };

  const handleVerifyAndReset = async (e) => {
    e.preventDefault();
    if (!otp || !newPassword) {
      setErrorMessage('Please fill in all fields.');
      return;
    }

    setErrorMessage('');
    setSuccessMessage('');
    setIsLoading(true);

    const response = await verifyForgotPassword({
      employeeNumber,
      otp,
      newPassword,
    });

    setIsLoading(false);

    if (response.error) {
      setErrorMessage(
        response.error || 'Unable to reset password. Please try again.',
      );
      return;
    }

    const result = response.data;
    if (!result) {
      setErrorMessage('Password reset failed.');
      return;
    }

    if (result.isSuccess === false) {
      setErrorMessage(
        result.error || result.message || 'Password reset failed.',
      );
      return;
    }

    setSuccessMessage('Password reset successfully. Redirecting to login...');
    setTimeout(() => {
      router.push('/login');
    }, 1200);
  };

  const handleResendOtp = async () => {
    setErrorMessage('');
    setSuccessMessage('');
    setIsLoading(true);

    const response = await forgotPassword({ employeeNumber });

    setIsLoading(false);

    if (response.error) {
      setErrorMessage(response.error || 'Unable to resend OTP.');
      return;
    }

    setSuccessMessage('A new OTP has been sent to your registered email.');
  };

  return (
    <form
      className={styles.loginForm}
      onSubmit={step === 1 ? handleRequestOtp : handleVerifyAndReset}
    >
      <div className={styles.logoWrap}>
        <Image src={Logo} alt="Wyn Logo" width={200} height={100} />
      </div>
      <h2 className={styles.title}>Forgot Password</h2>
      <div className={styles.subtitle}>
        {step === 1
          ? 'Enter your employee number to receive an OTP.'
          : 'Enter the OTP sent to you and choose a new password.'}
      </div>

      <button
        type="button"
        onClick={() => router.push('/login')}
        className={styles.togglePasswordBtn}
        style={{ position: 'static', alignSelf: 'flex-start' }}
      >
        <FiArrowLeft size={16} /> Back to login
      </button>

      {(errorMessage || successMessage) && (
        <div className={successMessage ? styles.success : styles.error}>
          {errorMessage || successMessage}
        </div>
      )}

      {step === 1 && (
        <Input
          id="forgot-employee-number"
          type="text"
          label="Employee number"
          placeholder="e.g. EMP-00123"
          value={employeeNumber}
          onChange={(e) => setEmployeeNumber(e.target.value)}
          autoComplete="username"
          icon={<FiHash size={20} />}
        />
      )}

      {step === 2 && (
        <>
          <Input
            id="forgot-otp"
            type="text"
            label="OTP"
            placeholder="Enter the 6-digit code"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            autoComplete="one-time-code"
            icon={<FiKey size={20} />}
          />
          <div style={{ position: 'relative' }}>
            <Input
              id="forgot-new-password"
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
        </>
      )}

      <Button type="submit" className={styles.signinBtn} disabled={isLoading}>
        {isLoading
          ? step === 1
            ? 'Sending OTP…'
            : 'Resetting password…'
          : step === 1
          ? 'Send OTP'
          : 'Reset Password'}
      </Button>

      {step === 2 && (
        <button
          type="button"
          onClick={handleResendOtp}
          disabled={isLoading}
          className={styles.togglePasswordBtn}
          style={{ position: 'static', marginTop: '8px' }}
        >
          Resend OTP
        </button>
      )}
    </form>
  );
}