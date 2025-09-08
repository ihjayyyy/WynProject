"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import React from 'react';
import '../globals.scss';
import styles from './page.module.scss';

export default function HomePage() {
  const router = useRouter();
  useEffect(() => {
    // You can replace this with your real auth check
    const isLoggedIn = false;
    if (!isLoggedIn) {
      router.replace("/login");
    }
  }, [router]);

  return (
    <main className={styles.container}>
      <h1>Welcome to the Home Page</h1>
    </main>
  );
}
