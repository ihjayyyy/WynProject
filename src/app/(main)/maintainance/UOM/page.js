'use client';
import { Suspense } from 'react';
import dynamic from 'next/dynamic';

const UnitOfMeasureLanding = dynamic(() => import("@/components/UnitOfMeasure/UnitOfMeasureLanding"), { ssr: false });

export default function Page() {
  return (
    <Suspense fallback={"Loading..."}>
      <UnitOfMeasureLanding/>
    </Suspense>
  );
}