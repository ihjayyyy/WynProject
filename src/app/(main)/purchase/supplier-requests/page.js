'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';

const PRSLanding = dynamic(
  () => import('@/components/PurchaseSupplierRequests/PSRLanding'),
  { ssr: false },
);

export default function Page() {
  return (
    <Suspense fallback={'Loading...'}>
      <PRSLanding />
    </Suspense>
  );
}
