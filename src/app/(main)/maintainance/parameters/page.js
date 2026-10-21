'use client';
import { Suspense } from 'react';
import dynamic from 'next/dynamic';

const ParameterLanding = dynamic(() => import('@/components/Parameter/ParameterLanding'), {
  ssr: false,
});

export default function Page() {
  return (
    <Suspense fallback={'Loading...'}>
      <ParameterLanding />
    </Suspense>
  );
}
