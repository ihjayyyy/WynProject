'use client';
import { Suspense } from 'react';
import dynamic from 'next/dynamic';

const UnitOfMeasureForm = dynamic(() => import("@/components/UnitOfMeasure/UnitOfMeasureForm"), { ssr: false });

export default function Page() {
  return (
    <Suspense fallback={"Loading..."}>
      <UnitOfMeasureForm/>
    </Suspense>
  );
}