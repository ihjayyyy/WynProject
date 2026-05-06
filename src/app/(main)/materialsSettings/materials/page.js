'use client';
import { Suspense } from 'react';
import dynamic from 'next/dynamic';

const MaterialsLanding = dynamic(() => import("@/components/Materials/MaterialsLanding"), { ssr: false });

export default function Page() {
  return (
    <Suspense fallback={"Loading..."}>
      <MaterialsLanding/>
    </Suspense>
  );
}