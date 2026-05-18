'use client';
import { Suspense } from 'react';
import dynamic from 'next/dynamic';

const PurchasePaymentsLanding = dynamic(
  () => import('@/components/PurchasePayments/PurchasePaymentsLanding'),
  { ssr: false },
);

export default function Page() {
  return (
    <Suspense fallback={'Loading...'}>
      <PurchasePaymentsLanding />
    </Suspense>
  );
}
