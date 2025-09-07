"use client";
import React, { useState } from "react";
import Image from "next/image";
import styles from "./LoginForm.module.scss";
import Button from "../ui/Button";

export default function LoginForm({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }
    setError("");
    onLogin?.({ email, password, remember });
  };

  return (
    <form className={styles.loginForm} onSubmit={handleSubmit}>
      <div className={styles.logoWrap}>
        <Image src="/ODR-Logo.png" alt="ODR-Logo" width={200} height={100} />
      </div>
      <h2 className={styles.title}>Welcome back</h2>
      <div className={styles.subtitle}>Please sign in to your account</div>
      {error && <div className={styles.error}>{error}</div>}
      <div className={styles.fieldLabel}>Email address</div>
      <div className={styles.inputIconWrap}>
        <span className={styles.inputIcon}>
          <svg width="20" height="20" fill="none" viewBox="0 0 20 20"><rect width="20" height="20" rx="4" fill="#F3F4F6"/><path d="M3.5 6.5A2 2 0 0 1 5.5 4.5h9a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-9a2 2 0 0 1-2-2v-7Zm1.75.25 5.25 3.5 5.25-3.5" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </span>
        <input
          type="email"
          className={styles.input}
          placeholder="you@example.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          autoComplete="username"
        />
      </div>
      <div className={styles.fieldLabel}>Password</div>
      <div className={styles.inputIconWrap}>
        <span className={styles.inputIcon}>
          <svg width="20" height="20" fill="none" viewBox="0 0 20 20"><rect width="20" height="20" rx="4" fill="#F3F4F6"/><path d="M7 10V8a3 3 0 1 1 6 0v2" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><rect x="5" y="10" width="10" height="6" rx="2" stroke="#9CA3AF" strokeWidth="1.5"/></svg>
        </span>
        <input
          type="password"
          className={styles.input}
          placeholder="••••••••"
          value={password}
          onChange={e => setPassword(e.target.value)}
          autoComplete="current-password"
        />
      </div>
      <div className={styles.optionsRow}>
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={remember}
            onChange={e => setRemember(e.target.checked)}
          />
          <span>Remember me</span>
        </label>
        <a href="#" className={styles.forgot}>Forgot your password?</a>
      </div>
      <Button type="submit" className={styles.signinBtn}>
        Sign in
      </Button>
    </form>
  );
}
