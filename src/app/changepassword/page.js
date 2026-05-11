'use client';

import styles from '../login/page.module.scss';

import ChangePasswordForm from '@/components/ChangePasswordForm/ChangePasswordForm';

export default function ChangePassword() {
  return (
    <main className={styles.container}>
      <ChangePasswordForm />
    </main>
  );
}
