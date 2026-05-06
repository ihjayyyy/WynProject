'use client';
import { Suspense } from 'react';
import dynamic from 'next/dynamic';

const MaterialRequestLanding = dynamic(() => import("@/components/Inventory/MaterialRequest/MaterialRequestLanding"), { ssr: false });

export default function Page() {
  return (
    <Suspense fallback={"Loading..."}>
      <MaterialRequestLanding/>
    </Suspense>
  );
}