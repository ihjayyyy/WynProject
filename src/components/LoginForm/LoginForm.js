"use client";
import React, { useState } from "react";
import Image from "next/image";
import styles from "./LoginForm.module.scss";
import Button from "../ui/Button/Button";
import Input from "../ui/Input/Input";
import { FiMail, FiLock } from "react-icons/fi";

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
      <Input
        id="login-email"
        type="email"
        label="Email address"
        placeholder="you@example.com"
        value={email}
        onChange={e => setEmail(e.target.value)}
        autoComplete="username"
  icon={<FiMail size={20} />}
      />
      <Input
        id="login-password"
        type="password"
        label="Password"
        placeholder="••••••••"
        value={password}
        onChange={e => setPassword(e.target.value)}
        autoComplete="current-password"
  icon={<FiLock size={20} />}
      />
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
