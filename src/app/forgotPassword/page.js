'use client';

import styles from '../login/page.module.scss';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';

const ForgotPasswordForm = dynamic(() => import("@/components/ForgotPasswordForm/ForgotPasswordForm"), { ssr: false });

export default function Page() {
  return (
    <Suspense fallback={"Loading..."}>
      <main className={styles.container}>
        <ForgotPasswordForm />
      </main>
    </Suspense>
  );
}