'use client';
import { Suspense } from 'react';
import dynamic from 'next/dynamic';

const UOMConversionLanding = dynamic(() => import("@/components/UOMConversion/UOMConversionLanding"), { ssr: false });

export default function Page() {
  return (
    <Suspense fallback={"Loading..."}>
      <UOMConversionLanding/>
    </Suspense>
  );
}