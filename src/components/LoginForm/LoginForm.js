'use client';
import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import styles from './LoginForm.module.scss';
import Button from '../ui/Button/Button';
import Input from '../ui/Input/Input';
import { FiUser, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';

import Logo from '@/assets/logo.jpg';

export default function LoginForm({ onLogin, errorMessage, isLoading }) {
  const [employeeNumber, setEmployeeNumber] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [localError, setLocalError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!employeeNumber || !password) {
      setLocalError('Please enter both employee number and password.');
      return;
    }
    setLocalError('');
    onLogin?.({ employeeNumber, password, remember });
  };

  const displayError = localError || errorMessage;

  return (
    <form className={styles.loginForm} onSubmit={handleSubmit}>
      <div className={styles.logoWrap}>
        <Image src={Logo} alt="Wyn Logo" width={200} height={100} />
      </div>
      <h2 className={styles.title}>Welcome back</h2>
      <div className={styles.subtitle}>Please sign in to your account</div>
      {displayError && <div className={styles.error}>{displayError}</div>}
      <Input
        id="login-employee-number"
        type="text"
        label="Employee Number"
        placeholder="e.g. EMP-001"
        value={employeeNumber}
        onChange={(e) => setEmployeeNumber(e.target.value)}
        autoComplete="username"
        icon={<FiUser size={20} />}
      />
      <div style={{ position: 'relative' }}>
        <Input
          id="login-password"
          type={showPassword ? 'text' : 'password'}
          label="Password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          icon={<FiLock size={20} />}
        />
        <button
          type="button"
          onClick={() => setShowPassword((prev) => !prev)}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
          title={showPassword ? 'Hide password' : 'Show password'}
          className={styles.togglePasswordBtn}
        >
          {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
        </button>
      </div>
      <div className={styles.optionsRow}>
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
          />
          <span>Remember me</span>
        </label>
        <Link href="/forgotPassword" className={styles.forgot}>
          Forgot your password?
        </Link>
      </div>
      <Button type="submit" className={styles.signinBtn} disabled={isLoading}>
        {isLoading ? 'Signing in…' : 'Sign in'}
      </Button>
    </form>
  );
}