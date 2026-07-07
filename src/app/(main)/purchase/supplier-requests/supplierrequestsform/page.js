'use client';
import { Suspense } from 'react';
import dynamic from 'next/dynamic';

const PSRForm = dynamic(
  () => import('@/components/PurchaseSupplierRequests/PSRForm'),
  { ssr: false },
);

export default function Page() {
  return (
    <Suspense fallback={'Loading...'}>
      <PSRForm />
    </Suspense>
  );
}
