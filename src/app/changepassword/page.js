'use client';

import styles from '../login/page.module.scss';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';

const ChangePasswordForm = dynamic(() => import("@/components/ChangePasswordForm/ChangePasswordForm"), { ssr: false });

export default function Page() {
  return (
    <Suspense fallback={"Loading..."}>
      <main className={styles.container}>
        <ChangePasswordForm />
      </main>
    </Suspense>
  );
}