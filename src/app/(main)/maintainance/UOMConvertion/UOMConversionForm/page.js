'use client';
import { Suspense } from 'react';
import dynamic from 'next/dynamic';

const UOMConversionForm = dynamic(() => import("@/components/UOMConversion/UOMConversionForm"), { ssr: false });

export default function Page() {
  return (
    <Suspense fallback={"Loading..."}>
      <UOMConversionForm/>
    </Suspense>
  );
}