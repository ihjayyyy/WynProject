'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';

const ReportsLanding = dynamic(() => import('@/components/Reports/ReportsLanding'), {
  ssr: false,
});

export default function Page() {
  return (
    <Suspense fallback={'Loading...'}>
      <ReportsLanding />
    </Suspense>
  );
}
