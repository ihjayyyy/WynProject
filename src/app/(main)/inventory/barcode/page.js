'use client';
import { Suspense } from 'react';
import dynamic from 'next/dynamic';

const BarcodeLanding = dynamic(() => import('@/components/Barcode/BarcodeLanding'), {
  ssr: false,
});

export default function Page() {
  return (
    <Suspense fallback={'Loading...'}>
      <BarcodeLanding />
    </Suspense>
  );
}
